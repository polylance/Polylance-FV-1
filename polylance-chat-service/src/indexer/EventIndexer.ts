import { ethers } from "ethers";
import { RpcPool } from "../rpc/RpcPool.js";

export interface IndexerCursor {
  lastBlockNumber: number;
  lastBlockHash?: string;
  updatedAt: number;
}

export interface IndexedEventLog {
  jobAddress: string;
  address?: string; // alias for jobAddress
  eventName: string;
  blockNumber: number;
  txHash: string;
  logIndex: number;
  timestamp: number;
  args: Record<string, any>;
}

export interface ReconciliationReport {
  timestamp: number;
  analyzedJobsCount: number;
  mismatchesCount: number;
  mismatches: {
    jobId: string;
    contractAddress: string;
    serverStatus: string;
    onChainStatus: string;
    serverAmount: string;
    onChainAmount: string;
    suggestedAction: string;
  }[];
}

const JOB_ESCROW_ABI = [
  "event JobFunded(uint256 amount)",
  "event PaymentReleased(uint256 toFreelancer, uint256 fee)",
  "event AutoReleased()",
  "event JobCancelled(uint256 refund)",
  "event DisputeRaised(address indexed by, uint8 reason, string evidenceIpfsHash)",
  "event DisputeResolved(uint256 freelancerBps, address indexed judge, string reasoningIpfsHash)",
  "function status() external view returns (uint8)",
  "function amount() external view returns (uint256)",
  "function client() external view returns (address)",
  "function freelancer() external view returns (address)",
  "function paymentToken() external view returns (address)",
];

const JOB_FACTORY_ABI = [
  "event JobDeployed(address indexed jobContract, address indexed client, address paymentToken)",
  "event JobPosted(address indexed jobAddress, address indexed client, string ipfsHash, address paymentToken)",
  "function getAllJobs() external view returns (address[] memory)",
];

export class EventIndexer {
  private rpcPool: RpcPool;
  private factoryAddress: string;
  private cursor: IndexerCursor;
  private processedLogs: Set<string> = new Set(); // "txHash:logIndex"
  private onEventCallback?: (event: IndexedEventLog) => Promise<void>;
  private pollInterval: NodeJS.Timeout | null = null;
  private isIndexing = false;
  private maxChunkSize: number;
  private currentChunkSize: number;
  private consecutiveSuccesses = 0;
  private getTargetAddressesCb?: () => string[];

  constructor(
    rpcPool: RpcPool,
    factoryAddress: string,
    initialCursor?: IndexerCursor,
    maxChunkSize: number = 50,
    getTargetAddresses?: () => string[]
  ) {
    if (!factoryAddress || !ethers.isAddress(factoryAddress)) {
      throw new Error(
        `[EventIndexer] Invalid or missing factoryAddress: "${factoryAddress}". EventIndexer requires a valid contract address.`
      );
    }
    this.rpcPool = rpcPool;
    this.factoryAddress = ethers.getAddress(factoryAddress);
    this.maxChunkSize = Math.min(maxChunkSize, 50); // Safe 50-block ceiling for Polygon RPCs
    this.currentChunkSize = this.maxChunkSize;
    this.getTargetAddressesCb = getTargetAddresses;
    this.cursor = initialCursor || {
      lastBlockNumber: 0,
      updatedAt: Date.now(),
    };
  }

  public setOnEvent(cb: (event: IndexedEventLog) => Promise<void>) {
    this.onEventCallback = cb;
  }

  public getCursor(): IndexerCursor {
    return { ...this.cursor };
  }

  public setCursor(blockNumber: number) {
    this.cursor.lastBlockNumber = blockNumber;
    this.cursor.updatedAt = Date.now();
  }

  public getChunkSize(): number {
    return this.currentChunkSize;
  }

  public getTargetAddresses(): string[] {
    const list: string[] = [this.factoryAddress];
    if (this.getTargetAddressesCb) {
      try {
        const extra = this.getTargetAddressesCb();
        if (Array.isArray(extra)) {
          for (const addr of extra) {
            if (addr && typeof addr === "string" && ethers.isAddress(addr)) {
              const normalized = ethers.getAddress(addr);
              if (!list.includes(normalized)) {
                list.push(normalized);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[EventIndexer] Error gathering target contract addresses:", err);
      }
    }
    return list;
  }

  private getRelevantTopics(): string[][] {
    const escrowIface = new ethers.Interface(JOB_ESCROW_ABI);
    const factoryIface = new ethers.Interface(JOB_FACTORY_ABI);
    const topic0List = [
      escrowIface.getEvent("JobFunded")!.topicHash,
      escrowIface.getEvent("PaymentReleased")!.topicHash,
      escrowIface.getEvent("AutoReleased")!.topicHash,
      escrowIface.getEvent("JobCancelled")!.topicHash,
      escrowIface.getEvent("DisputeRaised")!.topicHash,
      escrowIface.getEvent("DisputeResolved")!.topicHash,
      factoryIface.getEvent("JobDeployed")!.topicHash,
      factoryIface.getEvent("JobPosted")!.topicHash,
    ];
    return [topic0List];
  }

  public async start(intervalMs: number = 5000): Promise<void> {
    // If starting with 0, initialize cursor to currentBlock - 200 blocks
    if (this.cursor.lastBlockNumber <= 0) {
      try {
        const head = await this.rpcPool.execute((p) => p.getBlockNumber());
        this.cursor.lastBlockNumber = Math.max(0, head - 200);
        this.cursor.updatedAt = Date.now();
      } catch (err) {
        console.warn("[EventIndexer] Could not fetch initial head block, starting at 0:", err);
      }
    }

    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        this.pollLogs().catch((err) => {
          console.error("[EventIndexer] Error polling logs:", err);
        });
      }, intervalMs);
    }
  }

  public async startIndexing(intervalMs: number = 5000): Promise<void> {
    return this.start(intervalMs);
  }

  public stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Polls events in safe chunks with reorg lookback, adaptive sizing, and address filter
   */
  public async pollLogs(): Promise<number> {
    if (this.isIndexing) return 0;
    this.isIndexing = true;
    let eventsFound = 0;

    try {
      const headBlock = await this.rpcPool.execute(
        (p) => p.getBlockNumber(),
        { cacheKey: "headBlock", cacheTtlMs: 2000 }
      );

      if (headBlock <= 0) return 0;

      // Safe reorg lookback: start 10 blocks before cursor
      const fromBlock = Math.max(0, this.cursor.lastBlockNumber - 10);
      const toBlock = Math.min(headBlock, fromBlock + this.currentChunkSize);

      if (fromBlock > toBlock) return 0;

      const targetAddresses = this.getTargetAddresses();
      if (targetAddresses.length === 0) {
        console.error("[EventIndexer] Aborting pollLogs: No target addresses provided.");
        return 0;
      }

      const filter: ethers.Filter = {
        address: targetAddresses.length === 1 ? targetAddresses[0] : targetAddresses,
        topics: this.getRelevantTopics(),
        fromBlock,
        toBlock,
      };

      let logs: ethers.Log[] = [];
      try {
        logs = await this.rpcPool.execute(
          (p) => p.getLogs(filter),
          { cacheTtlMs: 1500 }
        );
        this.consecutiveSuccesses++;
        if (this.consecutiveSuccesses > 5 && this.currentChunkSize < this.maxChunkSize) {
          this.currentChunkSize = Math.min(this.maxChunkSize, this.currentChunkSize + 5);
        }
      } catch (err: any) {
        // Detect range limits, e.g. "limited to 0 - 50 blocks range" or -32602
        const msg = String(err?.message || "") + " " + String(err?.error?.message || "");
        const match = msg.match(/limited to (?:0\s*-\s*)?(\d+)/i) || msg.match(/range.*?(\d+)\s*blocks/i);
        if (match && match[1]) {
          const parsedLimit = parseInt(match[1], 10);
          if (parsedLimit > 0) {
            this.currentChunkSize = Math.max(5, Math.min(parsedLimit, this.currentChunkSize));
            this.maxChunkSize = Math.min(this.maxChunkSize, parsedLimit);
          }
        } else if (msg.includes("range") || msg.includes("too large") || err?.code === -32602) {
          this.currentChunkSize = Math.max(5, Math.floor(this.currentChunkSize / 2));
        }
        this.consecutiveSuccesses = 0;
        console.warn(
          `[EventIndexer] Adapted chunk size to ${this.currentChunkSize} blocks following RPC response: ${err?.message?.slice(0, 140)}`
        );
        // Do NOT advance cursor on error — next tick will retry with the smaller chunk size
        return 0;
      }

      const escrowIface = new ethers.Interface(JOB_ESCROW_ABI);
      const factoryIface = new ethers.Interface(JOB_FACTORY_ABI);

      for (const log of logs) {
        const dedupeKey = `${log.transactionHash.toLowerCase()}:${log.index}`;
        if (this.processedLogs.has(dedupeKey)) continue;

        let parsed: ethers.LogDescription | null = null;
        try {
          parsed = escrowIface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          try {
            parsed = factoryIface.parseLog({ topics: [...log.topics], data: log.data });
          } catch {
            // Not a relevant event
          }
        }

        if (!parsed) continue;

        this.processedLogs.add(dedupeKey);
        eventsFound++;

        const argsObj: Record<string, any> = {};
        parsed.fragment.inputs.forEach((input, i) => {
          const val = parsed!.args[i];
          argsObj[input.name] = typeof val === "bigint" ? val.toString() : val;
        });

        const eventRecord: IndexedEventLog = {
          jobAddress: log.address.toLowerCase(),
          address: log.address.toLowerCase(),
          eventName: parsed.name,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          logIndex: log.index,
          timestamp: Date.now(),
          args: argsObj,
        };

        console.log(`[EventIndexer] Processed event ${parsed.name} on ${log.address} in tx ${log.transactionHash}`);

        if (this.onEventCallback) {
          await this.onEventCallback(eventRecord).catch((cbErr) => {
            console.error(`[EventIndexer] Callback failed for event ${parsed!.name}:`, cbErr);
          });
        }
      }

      // ONLY advance cursor after logs are fetched and processed
      this.cursor.lastBlockNumber = toBlock;
      this.cursor.updatedAt = Date.now();

      // Catch-up mode: if we are more than 1 chunk behind head, schedule immediate follow-up
      if (headBlock - toBlock > this.currentChunkSize) {
        setTimeout(() => {
          this.pollLogs().catch(() => {});
        }, 100);
      }
    } catch (err: any) {
      console.warn("[EventIndexer] Notice during pollLogs:", err?.message || err);
    } finally {
      this.isIndexing = false;
    }

    return eventsFound;
  }

  /**
   * Compares DB / server state vs on-chain state for non-terminal and recent jobs
   */
  public async reconcile(jobs: any[]): Promise<ReconciliationReport> {
    const report: ReconciliationReport = {
      timestamp: Date.now(),
      analyzedJobsCount: 0,
      mismatchesCount: 0,
      mismatches: [],
    };

    const statusMap: Record<number, string> = {
      0: "Open",
      1: "Selected",
      2: "Submitted",
      3: "Disputed",
      4: "Completed",
      5: "Cancelled",
    };

    const targetJobs = jobs.filter(
      (j) =>
        j &&
        j.contractAddress &&
        ethers.isAddress(j.contractAddress) &&
        j.status !== "Completed" &&
        j.status !== "Cancelled"
    );

    report.analyzedJobsCount = targetJobs.length;

    for (const job of targetJobs) {
      try {
        const escrow = new ethers.Contract(job.contractAddress, JOB_ESCROW_ABI, this.rpcPool as any);

        const [statusCode, amountRaw] = await Promise.all([
          this.rpcPool.execute((p) => new ethers.Contract(job.contractAddress, JOB_ESCROW_ABI, p).status().catch(() => -1)),
          this.rpcPool.execute((p) => new ethers.Contract(job.contractAddress, JOB_ESCROW_ABI, p).amount().catch(() => 0n)),
        ]);

        if (statusCode === -1) continue;

        const onChainStatus = statusMap[Number(statusCode)] || "Unknown";
        const onChainAmount = amountRaw.toString();
        const serverStatus = job.status || "Open";

        // Detect critical state mismatch:
        // E.g., on-chain has funds (> 0) and status >= 1, but server says 'Open' or 'Selected'
        const hasFundsOnChain = BigInt(onChainAmount) > 0n;
        const serverSaysUnfunded = serverStatus === "Open" || serverStatus === "Selected";

        if (hasFundsOnChain && serverSaysUnfunded) {
          report.mismatchesCount++;
          report.mismatches.push({
            jobId: job.id,
            contractAddress: job.contractAddress,
            serverStatus,
            onChainStatus: "Funded",
            serverAmount: job.amountUsdc || "0",
            onChainAmount,
            suggestedAction: "SYNC_ON_CHAIN_FUNDED_STATE",
          });
        } else if (!hasFundsOnChain && serverStatus === "Funded") {
          report.mismatchesCount++;
          report.mismatches.push({
            jobId: job.id,
            contractAddress: job.contractAddress,
            serverStatus,
            onChainStatus,
            serverAmount: job.amountUsdc || "0",
            onChainAmount,
            suggestedAction: "INVESTIGATE_UNFUNDED_ON_CHAIN",
          });
        }
      } catch (err: any) {
        console.warn(`[Reconciliation] Error inspecting job ${job.id}:`, err?.message || err);
      }
    }

    return report;
  }
}
