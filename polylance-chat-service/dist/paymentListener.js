import { ethers } from "ethers";
const JobFactoryABI = [
    "event JobPosted(address indexed jobAddress, address indexed client, string ipfsHash, address paymentToken)"
];
const JobEscrowABI = [
    "function client() external view returns (address)",
    "function freelancer() external view returns (address)",
    "event PaymentReleased(uint256 toFreelancer, uint256 fee)",
    "event AutoReleased()",
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
            const normalizedAddr = jobAddress.toLowerCase();
            if (activeSubscriptions.has(normalizedAddr))
                return;
            activeSubscriptions.add(normalizedAddr);
            const job = new ethers.Contract(jobAddress, JobEscrowABI, provider);
            const unlockDeletion = async () => {
                const registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
                if (!registry)
                    return;
                await prisma.conversationKeyRegistry.update({
                    where: { jobAddress },
                    data: { deletionEligible: true },
                });
                io.to(jobAddress).emit("deletion-unlocked", { jobAddress });
                console.log(`[CHAT SERVICE] Deletion unlocked for ${jobAddress} — payment confirmed on-chain`);
            };
            job.on("PaymentReleased", unlockDeletion);
            job.on("AutoReleased", unlockDeletion);
            job.on("DisputeResolved", unlockDeletion);
        };
        // 1. Scan historical JobPosted events on startup
        try {
            const historicalLogs = await factory.queryFilter(factory.filters.JobPosted());
            for (const log of historicalLogs) {
                const eventLog = log;
                if (eventLog.args && eventLog.args[0]) {
                    attachJobListeners(eventLog.args[0]);
                }
            }
            console.log(`[CHAT SERVICE] Initialized historical payment listeners for ${historicalLogs.length} on-chain jobs`);
        }
        catch (e) {
            console.warn("[CHAT SERVICE] Historical log scan skipped or RPC unavailable");
        }
        // 2. Listen to real-time JobPosted events going forward
        factory.on("JobPosted", (jobAddress) => {
            attachJobListeners(jobAddress);
        });
        console.log("[CHAT SERVICE] On-chain payment event listener active on RPC:", rpcUrl);
    }
    catch (err) {
        console.warn("[CHAT SERVICE] Event listener setup warning:", err);
    }
}
