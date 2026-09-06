import { ethers } from "ethers";
const JobFactoryABI = [
    "event JobDeployed(address indexed jobContract, address indexed client, address paymentToken)",
    "event JobPosted(address indexed jobAddress, address indexed client, string ipfsHash, address paymentToken)",
    "function getAllJobs() external view returns (address[])"
];
const JobEscrowABI = [
    "function client() external view returns (address)",
    "function freelancer() external view returns (address)",
    "event PaymentReleased(uint256 toFreelancer, uint256 fee)",
    "event AutoReleased()",
    "event DisputeResolved(uint256 freelancerBps, address judge, string reasoningIpfsHash)",
    "event DisputeResolved(uint256 toFreelancer, uint256 toClient, uint256 fee)"
];
export async function startPaymentListener(prisma, io) {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const factoryAddress = process.env.JOB_FACTORY_ADDRESS;
    if (!factoryAddress || process.env.NODE_ENV === "test")
        return;
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const factory = new ethers.Contract(factoryAddress, JobFactoryABI, provider);
        const activeSubscriptions = new Set();
        const attachJobListeners = (jobAddress) => {
            if (!jobAddress || !ethers.isAddress(jobAddress))
                return;
            const normalizedAddr = jobAddress.toLowerCase();
            if (activeSubscriptions.has(normalizedAddr))
                return;
            activeSubscriptions.add(normalizedAddr);
            const job = new ethers.Contract(jobAddress, JobEscrowABI, provider);
            const unlockDeletion = async () => {
                try {
                    const registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
                    if (!registry)
                        return;
                    await prisma.conversationKeyRegistry.update({
                        where: { jobAddress },
                        data: { deletionEligible: true },
                    });
                    io.to(jobAddress).emit("deletion-unlocked", { jobAddress });
                    console.log(`[CHAT SERVICE] Deletion unlocked for ${jobAddress} — payment confirmed on-chain`);
                }
                catch (dbErr) {
                    console.warn(`[CHAT SERVICE] Could not update deletion status for ${jobAddress}:`, dbErr);
                }
            };
            job.on("PaymentReleased", unlockDeletion);
            job.on("AutoReleased", unlockDeletion);
            job.on("DisputeResolved", unlockDeletion);
        };
        // 1. Scan historical jobs via getAllJobs() directly (reliable across all RPC providers)
        try {
            const allJobs = await factory.getAllJobs().catch(() => []);
            if (Array.isArray(allJobs) && allJobs.length > 0) {
                allJobs.forEach(attachJobListeners);
                console.log(`[CHAT SERVICE] Attached listeners for ${allJobs.length} jobs via getAllJobs()`);
            }
        }
        catch (e) {
            console.warn("[CHAT SERVICE] getAllJobs scan skipped or failed:", e);
        }
        // 2. Scan historical logs via queryFilter as backup
        try {
            if (factory.filters && factory.filters.JobDeployed) {
                const historicalLogs = await factory.queryFilter(factory.filters.JobDeployed()).catch(() => []);
                for (const log of historicalLogs) {
                    const eventLog = log;
                    if (eventLog.args && eventLog.args[0]) {
                        attachJobListeners(eventLog.args[0]);
                    }
                }
            }
        }
        catch (e) {
            // queryFilter fallback
        }
        // 3. Listen to real-time JobDeployed / JobPosted events going forward
        factory.on?.("JobDeployed", (jobAddress) => {
            attachJobListeners(jobAddress);
        });
        factory.on?.("JobPosted", (jobAddress) => {
            attachJobListeners(jobAddress);
        });
        console.log("[CHAT SERVICE] On-chain payment event listener active on RPC:", rpcUrl);
    }
    catch (err) {
        console.warn("[CHAT SERVICE] Event listener setup warning:", err);
    }
}
