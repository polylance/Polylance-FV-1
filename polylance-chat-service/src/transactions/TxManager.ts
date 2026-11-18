import { ethers } from "ethers";
import { RpcPool } from "../rpc/RpcPool.js";

export type TransactionType = "FUND" | "RELEASE" | "REFUND" | "APPROVE" | "DISPUTE";
export type TransactionStatus =
  | "INITIATED"
  | "PENDING"
  | "CONFIRMING"
  | "CONFIRMED"
  | "FAILED"
  | "DROPPED"
  | "REPLACED";

export interface TransactionRecord {
  id: string; // intent ID
  jobId: string;
  engagementId?: string;
  type: TransactionType;
  chainId: number;
  from: string;
  to: string;
  token: string;
  tokenSymbol: string;
  amount: string; // BigInt string
  feeAmount: string; // BigInt string
  totalAmount: string; // BigInt string
  txHash?: string;
  replacementHash?: string;
  nonce?: number;
  status: TransactionStatus;
  confirmations: number;
  requiredConfirmations: number;
  blockNumber?: number;
  errorCode?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
  idempotencyKey: string;
  clientAcknowledged?: boolean;
}

export interface IntentCreationParams {
  jobId: string;
  engagementId?: string;
  type: TransactionType;
  from: string;
  idempotencyKey: string;
  jobData: any;
}

export class TxManager {
  private rpcPool: RpcPool;
  private transactions: Map<string, TransactionRecord> = new Map();
  private idempotencyIndex: Map<string, string> = new Map(); // idempotencyKey -> intentId
  private txHashIndex: Map<string, string> = new Map(); // txHash -> intentId
  private onStateChangeCallback?: (tx: TransactionRecord, job: any) => Promise<void>;
  private workerInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(rpcPool: RpcPool, initialTransactions: TransactionRecord[] = []) {
    this.rpcPool = rpcPool;
    for (const tx of initialTransactions) {
      this.transactions.set(tx.id, tx);
      if (tx.idempotencyKey) this.idempotencyIndex.set(tx.idempotencyKey, tx.id);
      if (tx.txHash) this.txHashIndex.set(tx.txHash.toLowerCase(), tx.id);
    }
  }

  public setOnStateChange(cb: (tx: TransactionRecord, job: any) => Promise<void>) {
    this.onStateChangeCallback = cb;
  }

  public getAllTransactions(): TransactionRecord[] {
    return Array.from(this.transactions.values());
  }

  public getTransaction(intentId: string): TransactionRecord | undefined {
    return this.transactions.get(intentId);
  }

  public getTransactionByHash(txHash: string): TransactionRecord | undefined {
    const id = this.txHashIndex.get(txHash.toLowerCase());
    return id ? this.transactions.get(id) : undefined;
  }

  public getRequiredConfirmations(amountUsd: number): number {
    if (amountUsd < 250) return 3;
    if (amountUsd <= 2500) return 5;
    return 10;
  }

  /**
   * 1. Create Transaction Intent (Server enforces amount, fee, token, spender from agreed terms)
   */
  public createIntent(params: IntentCreationParams): {
    intent: TransactionRecord;
    isExisting: boolean;
  } {
    const { jobId, engagementId, type, from, idempotencyKey, jobData } = params;
    const normalizedFrom = from.toLowerCase().trim();

    // Idempotency check: if intent with identical key exists, return it
    const existingId = this.idempotencyIndex.get(idempotencyKey);
    if (existingId) {
      const existing = this.transactions.get(existingId);
      if (existing) {
        return { intent: existing, isExisting: true };
      }
    }

    // Check for any currently pending / confirming funding transaction on this job/engagement
    if (type === "FUND") {
      for (const t of this.transactions.values()) {
        if (
          t.jobId.toLowerCase() === jobId.toLowerCase() &&
          t.type === "FUND" &&
          (t.status === "PENDING" || t.status === "CONFIRMING" || t.status === "INITIATED") &&
          Date.now() - t.createdAt < 30 * 60 * 1000 // 30 min expiration on unsubmitted intents
        ) {
          // If the caller already has an active initiated/pending/confirming tx, return it to block duplicate payments
          if (t.from.toLowerCase() === normalizedFrom) {
            return { intent: t, isExisting: true };
          }
          if (t.status === "PENDING" || t.status === "CONFIRMING") {
            throw new Error("A funding transaction is already pending or confirming on the blockchain for this job.");
          }
        }
      }
    }

    // Determine token details and exact BigInt math
    const tokenSymbol = (jobData?.paymentTokenSymbol || "USDC").toUpperCase();
    const isNative = tokenSymbol === "POL" || tokenSymbol === "MATIC";
    const decimals = isNative ? 18 : 6;
    const tokenAddress = isNative
      ? ethers.ZeroAddress
      : jobData?.paymentToken || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

    // Read agreed amount from terms
    let principalUnits: bigint;
    const agreedVersion = jobData?.engagement?.history?.slice().reverse().find((h: any) => h.status === "ACCEPTED");
    if (agreedVersion && agreedVersion.amountWei) {
      principalUnits = BigInt(agreedVersion.amountWei);
    } else if (isNative) {
      const valEth = jobData?.amountEth || "0.05";
      principalUnits = ethers.parseEther(valEth);
    } else {
      const valUsdc = jobData?.amountUsdc || "100";
      principalUnits = ethers.parseUnits(valUsdc, decimals);
    }

    // 2.5% platform fee
    const feeUnits = (principalUnits * 250n) / 10000n;
    const totalUnits = principalUnits + feeUnits;

    // Approximate USD value for confirmation depth determination
    let approxUsd = parseFloat(jobData?.amountUsdc || "100");
    if (isNative && jobData?.amountEth) {
      approxUsd = parseFloat(jobData.amountEth) * 0.40; // rough POL USD estimation
    }

    const requiredConfirmations = this.getRequiredConfirmations(approxUsd);
    const intentId = `tx-intent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const record: TransactionRecord = {
      id: intentId,
      jobId,
      engagementId,
      type,
      chainId: parseInt(process.env.CHAIN_ID || "137", 10),
      from: normalizedFrom,
      to: (jobData?.contractAddress || ethers.ZeroAddress).toLowerCase(),
      token: tokenAddress.toLowerCase(),
      tokenSymbol,
      amount: principalUnits.toString(),
      feeAmount: feeUnits.toString(),
      totalAmount: totalUnits.toString(),
      status: "INITIATED",
      confirmations: 0,
      requiredConfirmations,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      idempotencyKey,
    };

    this.transactions.set(intentId, record);
    this.idempotencyIndex.set(idempotencyKey, intentId);

    return { intent: record, isExisting: false };
  }

  /**
   * 2. Register Submitted Transaction Hash
   */
  public registerSubmitted(
    intentId: string,
    txHash: string,
    nonce?: number
  ): TransactionRecord {
    const tx = this.transactions.get(intentId);
    if (!tx) {
      throw new Error(`Transaction intent ${intentId} not found.`);
    }

    const cleanHash = txHash.toLowerCase().trim();
    if (!/^0x[a-f0-9]{64}$/i.test(cleanHash)) {
      throw new Error("Invalid transaction hash format.");
    }

    tx.txHash = cleanHash;
    if (nonce !== undefined) tx.nonce = nonce;
    tx.status = "PENDING";
    tx.updatedAt = Date.now();

    this.txHashIndex.set(cleanHash, intentId);

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(tx, null).catch(() => {});
    }

    // Immediately trigger a background check
    setImmediate(() => this.processSingleTransaction(tx).catch(() => {}));

    return tx;
  }

  public submitTransaction(intentId: string, txHash: string, nonce?: number): TransactionRecord {
    return this.registerSubmitted(intentId, txHash, nonce);
  }

  /**
   * Starts periodic worker checking pending & confirming transactions
   */
  public startWorker(intervalMs: number = 4000) {
    if (!this.workerInterval) {
      this.workerInterval = setInterval(() => {
        this.processAllActive().catch((err) => {
          console.error("[TxWorker] Error processing active transactions:", err);
        });
      }, intervalMs);
    }
  }

  public stopWorker() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
  }

  /**
   * Process all PENDING and CONFIRMING transactions
   */
  public async processAllActive(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const active = Array.from(this.transactions.values()).filter(
        (t) => (t.status === "PENDING" || t.status === "CONFIRMING") && Boolean(t.txHash)
      );

      for (const tx of active) {
        await this.processSingleTransaction(tx).catch((err) => {
          console.warn(`[TxWorker] Notice processing ${tx.id} (${tx.txHash}):`, err?.message || err);
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Checks a single transaction receipt, confirms confirmations, and detects dropped/replaced txs
   */
  public async processSingleTransaction(tx: TransactionRecord): Promise<void> {
    if (!tx.txHash) return;

    try {
      // Query receipt using RpcPool quorum for money integrity
      const receipt = await this.rpcPool.execute(
        (provider) => provider.getTransactionReceipt(tx.txHash!),
        { cacheKey: `receipt:${tx.txHash}` }
      );

      const currentBlock = await this.rpcPool.execute(
        (provider) => provider.getBlockNumber(),
        { cacheKey: "currentBlock", cacheTtlMs: 3000 }
      );

      if (receipt) {
        tx.blockNumber = receipt.blockNumber;
        const confs = Math.max(0, currentBlock - receipt.blockNumber + 1);
        tx.confirmations = confs;

        if (receipt.status === 1) {
          if (confs >= tx.requiredConfirmations) {
            tx.status = "CONFIRMED";
            tx.updatedAt = Date.now();
            console.log(`[TxWorker] Transaction ${tx.txHash} CONFIRMED with ${confs} confirmations.`);
            if (this.onStateChangeCallback) {
              await this.onStateChangeCallback(tx, null);
            }
          } else {
            tx.status = "CONFIRMING";
            tx.updatedAt = Date.now();
          }
        } else if (receipt.status === 0) {
          // Reverted transaction on-chain
          tx.status = "FAILED";
          tx.errorCode = "EXECUTION_REVERTED";
          tx.errorMessage = "Transaction reverted on Polygon.";
          tx.updatedAt = Date.now();
          console.warn(`[TxWorker] Transaction ${tx.txHash} REVERTED on-chain.`);
          if (this.onStateChangeCallback) {
            await this.onStateChangeCallback(tx, null);
          }
        }
      } else {
        // Receipt not yet mined — check if dropped or replaced
        const txResponse = await this.rpcPool.execute(
          (provider) => provider.getTransaction(tx.txHash!),
          { cacheKey: `tx:${tx.txHash}`, cacheTtlMs: 2000 }
        );

        if (!txResponse) {
          // Transaction not in mempool: check sender's current nonce to detect replacement or drop
          if (tx.nonce !== undefined && tx.from) {
            const currentNonce = await this.rpcPool.execute((provider) =>
              provider.getTransactionCount(tx.from, "latest")
            );
            if (currentNonce > tx.nonce) {
              // Nonce was consumed by another transaction!
              tx.status = "REPLACED";
              tx.errorMessage = "Transaction replaced by another transaction with higher fee.";
              tx.updatedAt = Date.now();
              console.warn(`[TxWorker] Transaction ${tx.txHash} replaced at nonce ${tx.nonce}.`);
              if (this.onStateChangeCallback) {
                await this.onStateChangeCallback(tx, null);
              }
              return;
            }
          }

          // Check if pending longer than 15 minutes without appearing in mempool
          if (Date.now() - tx.createdAt > 15 * 60 * 1000) {
            tx.status = "DROPPED";
            tx.errorCode = "MEMPOOL_DROPPED";
            tx.errorMessage = "Transaction was dropped from mempool due to timeout.";
            tx.updatedAt = Date.now();
            if (this.onStateChangeCallback) {
              await this.onStateChangeCallback(tx, null);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[TxWorker] Error querying receipt for ${tx.txHash}:`, err?.message || err);
    }
  }
}
