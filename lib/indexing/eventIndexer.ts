import { ethers } from "ethers";

export interface JobEventRecord {
  jobAddress: string;
  eventName: string;
  args: Record<string, unknown>;
  blockNumber: number;
  txHash: string;
  timestamp: number; // resolved from block
}

const JOB_ESCROW_ABI = [
  "event JobPosted(address client, string descriptionIpfsHash, address paymentToken)",
  "event ApplicationSubmitted(address applicant)",
  "event FreelancerSelected(address freelancer)",
  "event SelectionDeclined()",
  "event TermsProposed(address by, bytes32 termsHash)",
  "event JobFunded(uint256 amount)",
  "event WorkSubmitted(string title, uint256 evidenceCount)",
  "event PaymentReleased(uint256 toFreelancer, uint256 fee)",
  "event AutoReleased()",
  "event JobCancelled(uint256 refund)",
  "event CancelConsentGiven(address by)",
  "event DisputeRaised(address by, uint8 reason, string evidenceIpfsHash)",
  "event DisputeResponseSubmitted(address by, string responseIpfsHash)",
  "event DisputeResolved(uint256 freelancerBps, address judge, string reasoningIpfsHash)",
];

const JOB_FACTORY_ABI = [
  "function getAllJobs() external view returns (address[] memory)",
];

let globalProvider: ethers.Provider | null = null;
let globalFactoryAddress: string | null = null;

export function setIndexerConfig(provider: ethers.Provider, factoryAddress: string) {
  globalProvider = provider;
  globalFactoryAddress = factoryAddress;
}

export function getProvider(): ethers.Provider {
  if (globalProvider) return globalProvider;
  const rpcUrl = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getFactoryAddress(): string {
  if (globalFactoryAddress) return globalFactoryAddress;
  return process.env.JOB_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";
}

// Get every job clone address that's ever been deployed
export async function getAllJobAddresses(): Promise<string[]> {
  const provider = getProvider();
  const factoryAddr = getFactoryAddress();
  if (!factoryAddr || factoryAddr === ethers.ZeroAddress) return [];
  const factory = new ethers.Contract(factoryAddr, JOB_FACTORY_ABI, provider);
  return (await factory.getAllJobs()) as string[];
}

// Fetch full event history for ONE job clone
export async function getJobEvents(jobAddress: string): Promise<JobEventRecord[]> {
  const provider = getProvider();
  const contract = new ethers.Contract(jobAddress, JOB_ESCROW_ABI, provider);

  const filter = {
    address: jobAddress,
    fromBlock: 0,
    toBlock: "latest",
  };

  const logs = await provider.getLogs(filter);
  const blockNumbers = logs.map((l) => l.blockNumber);
  const blockTimestamps = await resolveBlockTimestamps(blockNumbers, provider);

  const eventRecords: JobEventRecord[] = [];

  for (const log of logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });

      if (!parsed) continue;

      // Extract named arguments safely into Record
      const argsObj: Record<string, unknown> = {};
      parsed.fragment.inputs.forEach((input, i) => {
        argsObj[input.name] = parsed.args[i];
      });

      eventRecords.push({
        jobAddress,
        eventName: parsed.name,
        args: argsObj,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        timestamp: blockTimestamps.get(log.blockNumber) ?? 0,
      });
    } catch {
      // Ignore unparsed log topics
    }
  }

  return eventRecords;
}

export async function resolveBlockTimestamps(
  blockNumbers: number[],
  provider: ethers.Provider
): Promise<Map<number, number>> {
  const unique = [...new Set(blockNumbers)];
  const map = new Map<number, number>();

  // Batch with concurrency limit — don't fire 500 simultaneous RPC calls
  const CONCURRENCY = 10;
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY);
    const blocks = await Promise.all(batch.map((bn) => provider.getBlock(bn)));
    blocks.forEach((b, idx) => {
      if (b) {
        map.set(batch[idx], Number(b.timestamp));
      }
    });
  }
  return map;
}
