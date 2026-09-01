import express from "express";
import http from "http";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { verifyWalletAuth } from "./auth.js";
import { createConversationKey } from "./crypto/ecies.js";
import { startPaymentListener } from "./paymentListener.js";
import { authLimiter, messageLimiter, joinLimiter, deleteLimiter, httpLimiter } from "./ratelimit.js";
dotenv.config();
const STATE_FILE = path.resolve(process.cwd(), "polylance_shared_state.json");
let sharedState = {
    jobs: [],
    profiles: {},
    daoProposals: [],
    judgeMessages: {},
    judges: [],
    treasuryProposals: [],
    treasuryHistory: [],
};
try {
    if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        sharedState = { ...sharedState, ...JSON.parse(raw) };
    }
}
catch (err) {
    console.warn("[STATE] Could not load initial shared state file:", err);
}
function persistState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState, null, 2), "utf-8");
    }
    catch (err) {
        console.warn("[STATE] Could not persist shared state file:", err);
    }
}
const primaryDbUrl = process.env.DATABASE_URL;
const backupDbUrl = process.env.BACKUP_DATABASE_URL;
export let prisma = null;
try {
    if (primaryDbUrl) {
        prisma = new PrismaClient({
            datasources: {
                db: {
                    url: primaryDbUrl,
                },
            },
        });
    }
    else {
        prisma = new PrismaClient();
    }
}
catch (err) {
    console.warn("[PRISMA] Primary DB client init note:", err?.message || err);
}
export let backupPrisma = null;
try {
    if (backupDbUrl) {
        backupPrisma = new PrismaClient({
            datasources: {
                db: {
                    url: backupDbUrl,
                },
            },
        });
    }
}
catch (err) {
    console.warn("[PRISMA] Backup DB client init note:", err?.message || err);
}
export function setPrismaInstance(instance) {
    prisma = instance;
}
process.on('uncaughtException', (err) => {
    console.error('[CHAT SERVICE UNCAUGHT EXCEPTION]', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
    console.warn('[CHAT SERVICE UNHANDLED REJECTION]', reason?.message || reason);
});
export async function loadStateFromDatabase() {
    // 1. Try Primary Database (Render PostgreSQL)
    try {
        if (prisma && prisma.protocolSharedState) {
            const record = await Promise.race([
                prisma.protocolSharedState.findUnique({ where: { key: "global_state" } }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Primary DB timeout")), 3500)),
            ]);
            if (record && record.data) {
                sharedState = { ...sharedState, ...record.data };
                console.log("[DB] Loaded shared state from Primary Database (Render PostgreSQL)");
                persistState();
                return;
            }
        }
    }
    catch (err) {
        console.warn("[DB] Primary DB load note:", err?.message || err);
    }
    // 2. Try Backup Database (Prisma Cloud)
    try {
        if (backupPrisma && backupPrisma.protocolSharedState) {
            const record = await Promise.race([
                backupPrisma.protocolSharedState.findUnique({ where: { key: "global_state" } }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Backup DB timeout")), 3000)),
            ]);
            if (record && record.data) {
                sharedState = { ...sharedState, ...record.data };
                console.log("[DB] Loaded shared state from Backup Database (Prisma Cloud)");
                persistState();
                return;
            }
        }
    }
    catch (err) {
        console.warn("[DB] Backup DB load note:", err?.message || err);
    }
}
let dbWriteDebounceTimer = null;
let isWritingToDb = false;
let pendingDbPayload = null;
async function executeDatabaseSync(payload) {
    if (isWritingToDb) {
        pendingDbPayload = payload;
        return;
    }
    isWritingToDb = true;
    try {
        // 1. Write to Primary DB (Render PostgreSQL)
        if (prisma && prisma.protocolSharedState) {
            try {
                await Promise.race([
                    prisma.protocolSharedState.upsert({
                        where: { key: "global_state" },
                        update: { data: payload },
                        create: { key: "global_state", data: payload },
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Primary DB write timeout")), 12000)),
                ]);
            }
            catch (err) {
                console.warn("[DB] Primary DB sync notice:", err?.message || err);
            }
        }
        // 2. Dual-write replication to Backup DB (Prisma Cloud)
        if (backupPrisma && backupPrisma.protocolSharedState) {
            try {
                await Promise.race([
                    backupPrisma.protocolSharedState.upsert({
                        where: { key: "global_state" },
                        update: { data: payload },
                        create: { key: "global_state", data: payload },
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Backup DB write timeout")), 12000)),
                ]);
            }
            catch (err) {
                console.warn("[DB] Backup DB sync notice:", err?.message || err);
            }
        }
    }
    finally {
        isWritingToDb = false;
        if (pendingDbPayload) {
            const next = pendingDbPayload;
            pendingDbPayload = null;
            executeDatabaseSync(next).catch(() => { });
        }
    }
}
export async function persistStateToDatabases() {
    persistState(); // file fallback immediately
    const payload = JSON.parse(JSON.stringify(sharedState));
    if (dbWriteDebounceTimer) {
        clearTimeout(dbWriteDebounceTimer);
    }
    dbWriteDebounceTimer = setTimeout(() => {
        executeDatabaseSync(payload).catch(() => { });
    }, 500);
}
function normalizeJobOnServer(job) {
    if (!job)
        return job;
    const next = { ...job };
    const isFundedEvent = (next.events || []).some((e) => e.step === 'Funded' && e.status === 'completed');
    const bothAgreed = Boolean(next.clientAgreedTerms && next.freelancerAgreedTerms);
    if (isFundedEvent || bothAgreed) {
        if (Array.isArray(next.events)) {
            next.events = next.events.map((evt) => {
                if (evt.step === 'Terms' && evt.status !== 'completed') {
                    return { ...evt, status: 'completed', timestamp: evt.timestamp || Date.now() };
                }
                return evt;
            });
        }
    }
    if (isFundedEvent && (next.status === 'Open' || next.status === 'Selected')) {
        next.status = 'Funded';
    }
    return next;
}
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const JOB_AUTO_EXPIRY_DAYS = 14;
export function isJobExpiredOnServer(job) {
    if (!job)
        return false;
    if (job.status !== 'Open' || Boolean(job.freelancer))
        return false;
    const postedAt = job.createdAt || Date.now();
    return (Date.now() - postedAt) >= (JOB_AUTO_EXPIRY_DAYS * MS_PER_DAY);
}
export function pruneExpiredJobsOnServer() {
    if (!Array.isArray(sharedState.jobs) || sharedState.jobs.length === 0)
        return;
    const beforeCount = sharedState.jobs.length;
    sharedState.jobs = sharedState.jobs.filter((j) => !isJobExpiredOnServer(j));
    if (sharedState.jobs.length !== beforeCount) {
        console.log(`[PRUNE] Automatically removed ${beforeCount - sharedState.jobs.length} expired (14+ days inactive) job(s) from database`);
        persistStateToDatabases().catch(() => { });
    }
}
function mergeJobsOnServer(existingJobs, incomingJobs) {
    const map = new Map();
    (existingJobs || []).forEach((j) => {
        if (!j)
            return;
        const norm = normalizeJobOnServer(j);
        const key = (norm.contractAddress || norm.id || '').toLowerCase();
        if (key)
            map.set(key, norm);
    });
    (incomingJobs || []).forEach((inJobRaw) => {
        if (!inJobRaw)
            return;
        const inJob = normalizeJobOnServer(inJobRaw);
        const key = (inJob.contractAddress || inJob.id || '').toLowerCase();
        if (!key)
            return;
        const curr = map.get(key);
        if (!curr) {
            map.set(key, inJob);
        }
        else {
            // Merge applications safely
            const appMap = new Map();
            (curr.applications || []).forEach((a) => a && a.applicant && appMap.set(a.applicant.toLowerCase(), a));
            (inJob.applications || []).forEach((a) => a && a.applicant && appMap.set(a.applicant.toLowerCase(), a));
            // Respect chatClearedAt so cleared messages are never re-merged from server memory
            const chatClearedAt = Math.max(curr.chatClearedAt || 0, inJob.chatClearedAt || 0);
            // Merge chat messages with smart deduplication (same sender + text within 3.5 seconds)
            const mergedMsgs = [];
            const allMsgs = [
                ...(curr.chatMessages || []),
                ...(inJob.chatMessages || [])
            ].filter((m) => !chatClearedAt || (m.timestamp || 0) > chatClearedAt).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            for (const m of allMsgs) {
                if (!m || !m.text)
                    continue;
                const isDuplicate = mergedMsgs.some((existing) => existing.sender === m.sender &&
                    existing.text.trim() === m.text.trim() &&
                    Math.abs((existing.timestamp || 0) - (m.timestamp || 0)) < 3500);
                if (!isDuplicate) {
                    mergedMsgs.push(m);
                }
            }
            // Merge pre-accept messages respecting chatClearedAt
            const mergedPreMsgs = [
                ...(curr.preAcceptMessages || []),
                ...(inJob.preAcceptMessages || [])
            ].filter((m) => !chatClearedAt || (m.timestamp || 0) > chatClearedAt);
            // Merge extension requests safely
            const extMap = new Map();
            (curr.extensionRequests || []).forEach((r) => r && extMap.set(r.id || `${r.requestIndex}`, r));
            (inJob.extensionRequests || []).forEach((r) => r && extMap.set(r.id || `${r.requestIndex}`, r));
            // Merge progress updates safely
            const progMap = new Map();
            (curr.progressUpdates || []).forEach((p) => p && progMap.set(p.id || `${p.timestamp}`, p));
            (inJob.progressUpdates || []).forEach((p) => p && progMap.set(p.id || `${p.timestamp}`, p));
            // Merge modification requests safely
            const modMap = new Map();
            (curr.modificationRequests || []).forEach((m) => m && modMap.set(m.id || `${m.requestedAt}`, m));
            (inJob.modificationRequests || []).forEach((m) => m && modMap.set(m.id || `${m.requestedAt}`, m));
            const merged = {
                ...curr,
                ...inJob,
                status: inJob.status || curr.status,
                freelancer: inJob.freelancer || curr.freelancer,
                clientAgreedTerms: inJob.clientAgreedTerms !== undefined ? inJob.clientAgreedTerms : curr.clientAgreedTerms,
                freelancerAgreedTerms: inJob.freelancerAgreedTerms !== undefined ? inJob.freelancerAgreedTerms : curr.freelancerAgreedTerms,
                termsHash: inJob.termsHash || curr.termsHash,
                amountUsdc: inJob.amountUsdc || curr.amountUsdc,
                amountEth: inJob.amountEth || curr.amountEth,
                paymentTokenSymbol: inJob.paymentTokenSymbol || curr.paymentTokenSymbol,
                applications: Array.from(appMap.values()),
                chatMessages: mergedMsgs,
                preAcceptMessages: mergedPreMsgs,
                chatClearedAt: chatClearedAt || undefined,
                events: inJob.events?.length ? inJob.events : curr.events,
                dispute: inJob.dispute || curr.dispute,
                proof: inJob.proof || curr.proof,
                progressUpdates: Array.from(progMap.values()),
                extensionRequests: Array.from(extMap.values()),
                modificationRequests: Array.from(modMap.values()),
            };
            map.set(key, normalizeJobOnServer(merged));
        }
    });
    return Array.from(map.values()).filter((j) => !isJobExpiredOnServer(j));
}
// Background cron every 60 seconds to prune expired inactive jobs
setInterval(pruneExpiredJobsOnServer, 60000);
const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || [
    "http://localhost:5173",
    "https://polylance-fv-1.onrender.com",
    "https://polylance.github.io",
    "https://polylance.codes",
].join(",")).split(",").map(o => o.trim()).filter(Boolean);
const isOriginAllowed = (origin) => {
    if (!origin)
        return true;
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*"))
        return true;
    if (origin.includes("localhost") || origin.includes("127.0.0.1"))
        return true;
    if (origin.includes("onrender.com") || origin.includes("github.io") || origin.includes("codes"))
        return true;
    return true; // Allow all browser clients to interact with public chat and data sync
};
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin))
            return callback(null, true);
        callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
// Security headers middleware
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});
// Global HTTP rate limiter for Express routes (bypasses /health for probes)
app.use(async (req, res, next) => {
    if (req.path === "/health" || req.path === "/api/health") {
        return next();
    }
    const ip = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "unknown";
    const { success } = await httpLimiter.limit(ip);
    if (!success) {
        res.status(429).json({ error: "Rate limit exceeded — try again shortly", code: "RATE_LIMITED" });
        return;
    }
    next();
});
export const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin))
                return callback(null, true);
            callback(new Error(`CORS: Origin '${origin}' is not allowed`));
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});
const JobEscrowABI = [
    "function client() external view returns (address)",
    "function freelancer() external view returns (address)"
];
function isValidPublicKey(pubKey) {
    if (!pubKey)
        return false;
    const clean = pubKey.startsWith("0x") ? pubKey.slice(2) : pubKey;
    return clean.length === 128 || clean.length === 130 || clean.length === 66;
}
export async function getOrCreateKeyRegistry(jobAddress, requesterAddress, clientPubKey, freelancerPubKey) {
    let registry = null;
    try {
        registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
    }
    catch (err) {
        if (process.env.NODE_ENV !== "test") {
            throw err;
        }
    }
    if (registry)
        return registry;
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    let clientAddr = null;
    let freelancerAddr = null;
    if (process.env.NODE_ENV === "test") {
        clientAddr = requesterAddress.toLowerCase();
        freelancerAddr = requesterAddress.toLowerCase();
    }
    else {
        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
            const jobContract = new ethers.Contract(jobAddress, JobEscrowABI, provider);
            const [c, f] = await Promise.all([
                jobContract.client(),
                jobContract.freelancer(),
            ]);
            if (c && c !== ethers.ZeroAddress)
                clientAddr = c.toLowerCase();
            if (f && f !== ethers.ZeroAddress)
                freelancerAddr = f.toLowerCase();
        }
        catch (err) {
            throw new Error("RPC_UNAVAILABLE: Could not verify on-chain client/freelancer roles for job contract");
        }
    }
    if (!clientAddr || !freelancerAddr) {
        throw new Error("ROLE_VERIFICATION_FAILED: On-chain client or freelancer address not found");
    }
    if (!isValidPublicKey(clientPubKey) || !isValidPublicKey(freelancerPubKey)) {
        throw new Error("MISSING_PUBLIC_KEY: Valid public keys for both client and freelancer are required to initialize the conversation key registry");
    }
    const keys = await createConversationKey(clientPubKey, freelancerPubKey);
    try {
        return await prisma.conversationKeyRegistry.create({
            data: {
                jobAddress,
                clientAddress: clientAddr,
                freelancerAddress: freelancerAddr,
                encryptedKeyForClient: keys.encryptedKeyForClient,
                encryptedKeyForFreelancer: keys.encryptedKeyForFreelancer,
                keyShredded: false,
            },
        });
    }
    catch (err) {
        if (process.env.NODE_ENV !== "test") {
            return {
                jobAddress,
                clientAddress: clientAddr,
                freelancerAddress: freelancerAddr,
                encryptedKeyForClient: keys.encryptedKeyForClient,
                encryptedKeyForFreelancer: keys.encryptedKeyForFreelancer,
                keyShredded: false,
                deletionEligible: false,
            };
        }
        throw err;
    }
}
function getKnownAdminAddresses() {
    const addrs = new Set();
    for (let i = 1; i <= 10; i++) {
        const val1 = process.env[`ADMIN_ADDRESS_${i}`]?.toLowerCase().trim();
        if (val1 && val1.startsWith("0x"))
            addrs.add(val1);
        const val2 = process.env[`VITE_ADMIN_ADDRESS_${i}`]?.toLowerCase().trim();
        if (val2 && val2.startsWith("0x"))
            addrs.add(val2);
    }
    const genericAdmin = process.env.ADMIN_ADDRESS?.toLowerCase().trim();
    if (genericAdmin && genericAdmin.startsWith("0x"))
        addrs.add(genericAdmin);
    return addrs;
}
function getKnownJudgeAddresses() {
    const addrs = new Set();
    for (let i = 1; i <= 5; i++) {
        const val1 = process.env[`JUDGE_${i}_ADDRESS`]?.toLowerCase().trim();
        if (val1 && val1.startsWith("0x"))
            addrs.add(val1);
    }
    const genericJudge = (process.env.JUDGE_ADDRESS || process.env.VITE_JUDGE_ADDRESS)?.toLowerCase().trim();
    if (genericJudge && genericJudge.startsWith("0x"))
        addrs.add(genericJudge);
    return addrs;
}
export function isAuthorizedAdmin(address) {
    if (!address)
        return false;
    return getKnownAdminAddresses().has(address.toLowerCase().trim());
}
export function isAuthorizedJudge(address) {
    if (!address)
        return false;
    const addr = address.toLowerCase().trim();
    if (getKnownJudgeAddresses().has(addr))
        return true;
    return (sharedState.judges || []).some((j) => j && j.address && j.address.toLowerCase().trim() === addr && j.status === "Active");
}
export function sanitizeSharedStateForRequester(state, requesterAddress) {
    const reqAddr = (requesterAddress || "").toLowerCase().trim();
    const isAdmin = isAuthorizedAdmin(reqAddr);
    const isJudge = isAuthorizedJudge(reqAddr);
    // 1. Sanitize Jobs:
    // Strictly protect sensitive work submission proofs, private escrow chats, proposals, and application texts.
    const sanitizedJobs = (state.jobs || []).map((job) => {
        if (!job)
            return job;
        const clientAddr = (job.client || "").toLowerCase().trim();
        const freelancerAddr = (job.freelancer || "").toLowerCase().trim();
        const isParty = Boolean(reqAddr && (clientAddr === reqAddr || freelancerAddr === reqAddr));
        const hasApplied = Boolean(reqAddr &&
            (job.applications || []).some((a) => a && a.applicant && a.applicant.toLowerCase().trim() === reqAddr));
        const isDisputeJudge = Boolean(isJudge && job.status === "Disputed");
        // Work delivery proof & milestone modifications: strictly for client, assigned freelancer, or admin
        const canSeeProof = isAdmin || isParty;
        // Private chats and active negotiation thread: for parties, applicants, dispute judge, or admin
        const canAccessPrivateJobChat = isAdmin || isParty || hasApplied || isDisputeJudge;
        // Applications: client or admin sees full applications including proposalText;
        // other callers see the applicants list with sensitive proposal text hidden
        let sanitizedApplications = [];
        const rawApps = job.applications || [];
        if (isAdmin || (reqAddr && clientAddr === reqAddr)) {
            sanitizedApplications = rawApps;
        }
        else {
            sanitizedApplications = rawApps.map((a) => {
                if (!a)
                    return a;
                const isOwn = reqAddr && a.applicant && a.applicant.toLowerCase().trim() === reqAddr;
                if (isOwn)
                    return a;
                // Strip sensitive proposal text, preserve applicant overview for counters & public cards
                const { proposalText: _pt, ...publicApp } = a;
                return publicApp;
            });
        }
        // Proof of work: Only visible to authorized contract parties (client / hired freelancer / admin)
        const proof = canSeeProof ? job.proof : undefined;
        const negotiationProposals = canAccessPrivateJobChat ? (job.negotiationProposals || []) : [];
        const modificationRequests = canSeeProof ? (job.modificationRequests || []) : [];
        const extensionRequests = canSeeProof ? (job.extensionRequests || []) : [];
        // Dispute details: strip private evidence/reasoning texts for unrelated callers
        let sanitizedDispute = undefined;
        if (job.dispute) {
            if (canAccessPrivateJobChat) {
                sanitizedDispute = job.dispute;
            }
            else {
                const { evidenceText, responseText, reasoningText, evidenceIpfsHash, responseIpfsHash, ...publicDispute } = job.dispute;
                sanitizedDispute = publicDispute;
            }
        }
        if (canAccessPrivateJobChat) {
            return {
                ...job,
                proof,
                negotiationProposals,
                modificationRequests,
                extensionRequests,
                applications: sanitizedApplications,
                dispute: sanitizedDispute,
            };
        }
        // Unauthenticated or unrelated caller: Clean public fields only
        const { chatMessages, preAcceptMessages, proof: _p, modificationRequests: _m, extensionRequests: _e, negotiationProposals: _np, events: _ev, ...publicJobFields } = job;
        return {
            ...publicJobFields,
            chatMessages: [],
            preAcceptMessages: [],
            applications: sanitizedApplications,
            dispute: sanitizedDispute,
            proof: undefined,
            modificationRequests: [],
            extensionRequests: [],
            negotiationProposals: [],
        };
    });
    // 2. Sanitize Judge Messages:
    // Only the specific judge or admins can see judgeMessages[judgeAddress]
    let sanitizedJudgeMessages = {};
    if (isAdmin) {
        sanitizedJudgeMessages = state.judgeMessages || {};
    }
    else if (isJudge && reqAddr) {
        sanitizedJudgeMessages = {};
        if (state.judgeMessages && state.judgeMessages[reqAddr]) {
            sanitizedJudgeMessages[reqAddr] = state.judgeMessages[reqAddr];
        }
    }
    else {
        // Public/unauthenticated callers get an empty object
        sanitizedJudgeMessages = {};
    }
    // 3. Sanitize User Profiles:
    // Return public directory view for all callers worldwide, protecting private credentials
    const sanitizedProfiles = {};
    if (state.profiles) {
        for (const [addr, p] of Object.entries(state.profiles)) {
            if (!p)
                continue;
            const lowerKey = addr.toLowerCase().trim();
            const isOwner = Boolean(reqAddr && lowerKey === reqAddr);
            if (isAdmin || isOwner) {
                sanitizedProfiles[addr] = p;
            }
            else {
                // Public directory view: strip any private keys, attestation secrets, and non-public notes
                const { email, phone, attestationUID, secretKey, privateNotes, ...publicProfile } = p;
                sanitizedProfiles[addr] = publicProfile;
            }
        }
    }
    // 4. Sanitize DAO & Treasury Proposals:
    // Internal multisig signature payloads and draft proposals are restricted to authenticated admins
    let sanitizedTreasuryProposals = [];
    let sanitizedTreasuryHistory = [];
    if (isAdmin) {
        sanitizedTreasuryProposals = state.treasuryProposals || [];
        sanitizedTreasuryHistory = state.treasuryHistory || [];
    }
    else if (reqAddr) {
        sanitizedTreasuryProposals = (state.treasuryProposals || []).map((p) => {
            const { signatures, signerDetails, ...publicProp } = p;
            return publicProp;
        });
        sanitizedTreasuryHistory = state.treasuryHistory || [];
    }
    // 5. Return sanitized public + scoped state
    return {
        jobs: sanitizedJobs,
        profiles: sanitizedProfiles,
        daoProposals: state.daoProposals || [],
        judgeMessages: sanitizedJudgeMessages,
        judges: state.judges || [],
        treasuryProposals: sanitizedTreasuryProposals,
        treasuryHistory: sanitizedTreasuryHistory,
    };
}
export function broadcastScopedRealtimeSync() {
    try {
        for (const [_, clientSocket] of io.sockets.sockets) {
            const clientAddr = clientSocket.data?.address;
            clientSocket.emit("realtime-sync", sanitizeSharedStateForRequester(sharedState, clientAddr));
        }
    }
    catch (err) {
        console.warn("[SYNC] Scoped broadcast notice:", err);
    }
}
// Socket authentication & connection rate limiting middleware
io.use(async (socket, next) => {
    const ip = socket.handshake.address || "unknown";
    const { success } = await authLimiter.limit(ip);
    if (!success) {
        console.warn(`Rate limit: connection attempt throttled from ${ip}`);
        return next(new Error("Too many connection attempts — try again shortly"));
    }
    const { address, signature, message } = socket.handshake.auth || {};
    if (address && signature && message) {
        const verified = await verifyWalletAuth(address, signature, message);
        if (verified) {
            socket.data.address = address.toLowerCase();
        }
    }
    next();
});
io.on("connection", (socket) => {
    const walletAddress = socket.data.address;
    // Content-Blind Room Join with Rate Limiting (20 joins/min per wallet)
    socket.on("join-job-chat", async (data, callback) => {
        const { success } = await joinLimiter.limit(walletAddress);
        if (!success) {
            return callback?.({ error: "Too many join attempts — slow down" });
        }
        const jobAddress = typeof data === "string" ? data : data?.jobAddress;
        if (!jobAddress)
            return callback?.({ error: "Missing jobAddress" });
        try {
            const registry = await getOrCreateKeyRegistry(jobAddress, walletAddress, data?.clientPubKey, data?.freelancerPubKey);
            if (!registry || registry.keyShredded) {
                return callback?.({ error: "Conversation unavailable or deleted", cids: [] });
            }
            const isClient = registry.clientAddress.toLowerCase() === walletAddress;
            const isFreelancer = registry.freelancerAddress.toLowerCase() === walletAddress;
            if (!isClient && !isFreelancer) {
                return callback?.({ error: "UNAUTHORIZED: Not a party to this job chat" });
            }
            socket.join(jobAddress);
            const encryptedKeyCopy = isClient
                ? registry.encryptedKeyForClient
                : registry.encryptedKeyForFreelancer;
            const index = await prisma.messageIndex.findMany({
                where: { jobAddress },
                orderBy: { sentAt: "asc" },
            });
            callback?.({
                encryptedKeyCopy,
                deletionEligible: registry.deletionEligible,
                keyShredded: registry.keyShredded,
                cids: index.map((i) => i.messageCid),
            });
        }
        catch (err) {
            callback?.({ error: err.message || "Failed to join job chat" });
        }
    });
    // Content-Blind Message Relay with Rate Limiting (30 messages/min per wallet)
    socket.on("send-message-notify", async (data, callback) => {
        const { success } = await messageLimiter.limit(walletAddress);
        if (!success) {
            return callback?.({ error: "Message rate limit exceeded — slow down" });
        }
        if (!data?.jobAddress || !data?.cid) {
            return callback?.({ error: "Missing required fields" });
        }
        const registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress: data.jobAddress } });
        if (!registry || registry.keyShredded) {
            return callback?.({ error: "Conversation unavailable or key shredded" });
        }
        const isClient = registry.clientAddress.toLowerCase() === walletAddress;
        const isFreelancer = registry.freelancerAddress.toLowerCase() === walletAddress;
        if (!isClient && !isFreelancer) {
            return callback?.({ error: "UNAUTHORIZED: Only client or freelancer can post messages to this job chat" });
        }
        const indexItem = await prisma.messageIndex.create({
            data: {
                jobAddress: data.jobAddress,
                messageCid: data.cid,
                senderAddress: walletAddress,
            },
        });
        io.to(data.jobAddress).emit("new-message-cid", {
            jobAddress: data.jobAddress,
            cid: data.cid,
            senderAddress: walletAddress,
            sentAt: indexItem.sentAt,
        });
        callback?.({ success: true, cid: data.cid });
    });
    // CRYPTO-SHREDDING DELETION with Rate Limiting (5 deletes/hour per wallet)
    socket.on("delete-conversation", async (jobAddress, callback) => {
        const { success } = await deleteLimiter.limit(walletAddress);
        if (!success) {
            return callback?.({ error: "Too many deletion attempts" });
        }
        if (!jobAddress)
            return callback?.({ error: "Missing jobAddress" });
        const registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
        if (!registry)
            return callback?.({ error: "Conversation registry not found" });
        const isClient = registry.clientAddress.toLowerCase() === walletAddress;
        const isFreelancer = registry.freelancerAddress.toLowerCase() === walletAddress;
        if (!isClient && !isFreelancer) {
            return callback?.({ error: "UNAUTHORIZED: Not a party to this job chat" });
        }
        if (!registry.deletionEligible) {
            return callback?.({ error: "Cannot delete — payment has not been released yet" });
        }
        await prisma.conversationKeyRegistry.update({
            where: { jobAddress },
            data: {
                encryptedKeyForClient: "SHREDDED",
                encryptedKeyForFreelancer: "SHREDDED",
                keyShredded: true,
            },
        });
        await prisma.messageIndex.deleteMany({ where: { jobAddress } });
        io.to(jobAddress).emit("conversation-deleted", { by: walletAddress, jobAddress });
        callback?.({ success: true, keyShredded: true });
    });
    // REAL-TIME MULTI-CLIENT DATA SYNCHRONIZATION (Scoped to connected wallet)
    socket.emit("realtime-sync", sanitizeSharedStateForRequester(sharedState, walletAddress));
    socket.on("client-sync", async (incoming) => {
        if (!incoming || typeof incoming !== "object")
            return;
        const socketAddr = (socket.data?.address || "").toLowerCase().trim();
        if (!socketAddr || !/^0x[a-fA-F0-9]{40}$/.test(socketAddr)) {
            return; // Disallow state mutations from unauthenticated sockets
        }
        const isAdmin = isAuthorizedAdmin(socketAddr);
        if (Array.isArray(incoming.jobs)) {
            const allowedJobs = incoming.jobs.filter((j) => {
                if (!j)
                    return false;
                if (isAdmin)
                    return true;
                const client = (j.client || "").toLowerCase().trim();
                const freelancer = (j.freelancer || "").toLowerCase().trim();
                const isApplicant = (j.applications || []).some((a) => a && a.applicant && a.applicant.toLowerCase().trim() === socketAddr);
                return client === socketAddr || freelancer === socketAddr || isApplicant;
            });
            if (allowedJobs.length > 0) {
                sharedState.jobs = mergeJobsOnServer(sharedState.jobs, allowedJobs);
            }
        }
        if (incoming.profiles && typeof incoming.profiles === "object") {
            if (isAdmin) {
                sharedState.profiles = { ...sharedState.profiles, ...incoming.profiles };
            }
            else {
                for (const [profAddr, profData] of Object.entries(incoming.profiles)) {
                    if (profAddr.toLowerCase().trim() === socketAddr) {
                        sharedState.profiles = {
                            ...sharedState.profiles,
                            [socketAddr]: profData,
                            [profAddr]: profData,
                        };
                    }
                }
            }
        }
        if (incoming.daoProposals && Array.isArray(incoming.daoProposals)) {
            if (isAdmin) {
                sharedState.daoProposals = incoming.daoProposals;
            }
            else {
                const existing = new Map((sharedState.daoProposals || []).map((p) => [String(p.id), p]));
                incoming.daoProposals.forEach((p) => {
                    if (p && p.id) {
                        const proposer = (p.proposer || p.proposerAddress || "").toLowerCase().trim();
                        if (proposer === socketAddr || !existing.has(String(p.id))) {
                            existing.set(String(p.id), p);
                        }
                    }
                });
                sharedState.daoProposals = Array.from(existing.values());
            }
        }
        if (incoming.judgeMessages && typeof incoming.judgeMessages === "object") {
            if (isAdmin) {
                sharedState.judgeMessages = { ...sharedState.judgeMessages, ...incoming.judgeMessages };
            }
            else if (incoming.judgeMessages[socketAddr] && Array.isArray(incoming.judgeMessages[socketAddr])) {
                sharedState.judgeMessages[socketAddr] = incoming.judgeMessages[socketAddr];
            }
        }
        if (incoming.deletedJobId) {
            const delId = String(incoming.deletedJobId).toLowerCase().trim();
            const targetJob = (sharedState.jobs || []).find((j) => j && (String(j.id).toLowerCase() === delId || String(j.contractAddress || "").toLowerCase() === delId));
            if (targetJob) {
                const client = (targetJob.client || "").toLowerCase().trim();
                if (isAdmin || client === socketAddr) {
                    sharedState.jobs = (sharedState.jobs || []).filter((j) => j && String(j.id).toLowerCase() !== delId && String(j.contractAddress || "").toLowerCase() !== delId);
                }
            }
        }
        if (isAdmin) {
            if (incoming.judges && Array.isArray(incoming.judges))
                sharedState.judges = incoming.judges;
            if (incoming.treasuryProposals && Array.isArray(incoming.treasuryProposals))
                sharedState.treasuryProposals = incoming.treasuryProposals;
            if (incoming.treasuryHistory && Array.isArray(incoming.treasuryHistory))
                sharedState.treasuryHistory = incoming.treasuryHistory;
        }
        await persistStateToDatabases();
        broadcastScopedRealtimeSync();
    });
});
// REST endpoints for cross-device state synchronization
app.get("/api/sync", async (req, res) => {
    // If state is empty in memory, try fetching from primary or backup DB
    if (!sharedState.jobs || sharedState.jobs.length === 0) {
        await loadStateFromDatabase();
    }
    const requesterAddress = (req.headers["x-wallet-address"] ||
        req.query.address ||
        "").toLowerCase().trim();
    const sanitized = sanitizeSharedStateForRequester(sharedState, requesterAddress);
    res.json(sanitized);
});
app.post("/api/sync", async (req, res) => {
    try {
        const requesterAddress = (req.headers["x-wallet-address"] ||
            req.query.address ||
            "").toLowerCase().trim();
        // Guard: Disallow unauthenticated or console anonymous state mutation attempts
        if (!requesterAddress || !/^0x[a-fA-F0-9]{40}$/.test(requesterAddress)) {
            return res.status(401).json({
                error: "Unauthorized: Valid authenticated wallet address required for state synchronization",
                code: "UNAUTHORIZED_CONSOLE_MUTATION"
            });
        }
        const incoming = req.body;
        if (incoming) {
            const isAdmin = isAuthorizedAdmin(requesterAddress);
            // 1. Jobs: Users can only create or update jobs they are party to (or admin)
            if (Array.isArray(incoming.jobs)) {
                const allowedJobs = incoming.jobs.filter((j) => {
                    if (!j)
                        return false;
                    if (isAdmin)
                        return true;
                    const client = (j.client || '').toLowerCase().trim();
                    const freelancer = (j.freelancer || '').toLowerCase().trim();
                    const isApplicant = (j.applications || []).some((a) => a && a.applicant && a.applicant.toLowerCase().trim() === requesterAddress);
                    return client === requesterAddress || freelancer === requesterAddress || isApplicant;
                });
                if (allowedJobs.length > 0) {
                    sharedState.jobs = mergeJobsOnServer(sharedState.jobs, allowedJobs);
                }
            }
            // 2. Profiles: Non-admins can strictly ONLY create/update their OWN profile
            if (incoming.profiles && typeof incoming.profiles === 'object') {
                if (isAdmin) {
                    sharedState.profiles = { ...sharedState.profiles, ...incoming.profiles };
                }
                else {
                    for (const [profAddr, profData] of Object.entries(incoming.profiles)) {
                        if (profAddr.toLowerCase().trim() === requesterAddress) {
                            sharedState.profiles = {
                                ...sharedState.profiles,
                                [requesterAddress]: profData,
                                [profAddr]: profData,
                            };
                        }
                    }
                }
            }
            // 3. DAO Proposals: Merge securely without spoofing
            if (incoming.daoProposals && Array.isArray(incoming.daoProposals)) {
                if (isAdmin) {
                    sharedState.daoProposals = incoming.daoProposals;
                }
                else {
                    const existing = new Map((sharedState.daoProposals || []).map((p) => [String(p.id), p]));
                    incoming.daoProposals.forEach((p) => {
                        if (p && p.id) {
                            const proposer = (p.proposer || p.proposerAddress || '').toLowerCase().trim();
                            if (proposer === requesterAddress || !existing.has(String(p.id))) {
                                existing.set(String(p.id), p);
                            }
                        }
                    });
                    sharedState.daoProposals = Array.from(existing.values());
                }
            }
            // 4. Judge Messages: Only recipient or admin
            if (incoming.judgeMessages) {
                if (isAdmin) {
                    sharedState.judgeMessages = { ...sharedState.judgeMessages, ...incoming.judgeMessages };
                }
                else {
                    for (const [judgeAddr, msgs] of Object.entries(incoming.judgeMessages)) {
                        if (judgeAddr.toLowerCase() === requesterAddress && Array.isArray(msgs)) {
                            sharedState.judgeMessages[judgeAddr.toLowerCase()] = msgs;
                        }
                    }
                }
            }
            // 5. Job Deletion: Only client or admin
            if (incoming.deletedJobId) {
                const delId = String(incoming.deletedJobId).toLowerCase().trim();
                const targetJob = (sharedState.jobs || []).find((j) => j && (String(j.id).toLowerCase() === delId || String(j.contractAddress || '').toLowerCase() === delId));
                if (targetJob) {
                    const isClient = String(targetJob.client || '').toLowerCase().trim() === requesterAddress;
                    if (isAdmin || isClient) {
                        sharedState.jobs = (sharedState.jobs || []).filter((j) => j && String(j.id).toLowerCase() !== delId && String(j.contractAddress || '').toLowerCase() !== delId);
                    }
                }
            }
            // 6. Treasury & Judges: Strictly Admin only
            if (isAdmin) {
                if (incoming.judges)
                    sharedState.judges = incoming.judges;
                if (incoming.treasuryProposals)
                    sharedState.treasuryProposals = incoming.treasuryProposals;
                if (incoming.treasuryHistory)
                    sharedState.treasuryHistory = incoming.treasuryHistory;
            }
            await persistStateToDatabases();
            broadcastScopedRealtimeSync();
        }
        res.json({ success: true, authorized: true });
    }
    catch (err) {
        console.error("[SYNC ERROR]", err);
        res.status(500).json({ error: "Failed to process sync request", details: err?.message });
    }
});
// Delete a job permanently from server state and databases (Authorized Client / Admin only)
app.delete("/api/jobs/:id", async (req, res) => {
    try {
        const jobId = String(req.params.id || "").toLowerCase().trim();
        if (!jobId)
            return res.status(400).json({ error: "Missing job ID" });
        const requesterAddress = (req.headers["x-wallet-address"] ||
            req.query.address ||
            "").toLowerCase().trim();
        const targetJob = (sharedState.jobs || []).find((j) => j && (String(j.id).toLowerCase() === jobId || String(j.contractAddress || '').toLowerCase() === jobId));
        if (targetJob) {
            const isClient = String(targetJob.client || '').toLowerCase().trim() === requesterAddress;
            const isAdmin = isAuthorizedAdmin(requesterAddress);
            if (!isClient && !isAdmin) {
                return res.status(403).json({ error: "Forbidden: Only the job creator or protocol admin can delete this job" });
            }
        }
        sharedState.jobs = (sharedState.jobs || []).filter((j) => j && String(j.id).toLowerCase() !== jobId && String(j.contractAddress || '').toLowerCase() !== jobId);
        await persistStateToDatabases();
        broadcastScopedRealtimeSync();
        res.json({ success: true, deletedJobId: jobId });
    }
    catch (err) {
        console.error("[DELETE JOB ERROR]", err);
        res.status(500).json({ error: "Failed to delete job", details: err?.message });
    }
});
// Delete job chat messages permanently (Authorized Party / Admin only)
app.delete("/api/jobs/:id/chat", async (req, res) => {
    try {
        const jobId = String(req.params.id || "").toLowerCase().trim();
        if (!jobId)
            return res.status(400).json({ error: "Missing job ID" });
        const requesterAddress = (req.headers["x-wallet-address"] ||
            req.query.address ||
            "").toLowerCase().trim();
        const targetJob = (sharedState.jobs || []).find((j) => j && (String(j.id).toLowerCase() === jobId || String(j.contractAddress || '').toLowerCase() === jobId));
        if (targetJob) {
            const isClient = String(targetJob.client || '').toLowerCase().trim() === requesterAddress;
            const isFreelancer = String(targetJob.freelancer || '').toLowerCase().trim() === requesterAddress;
            const isAdmin = isAuthorizedAdmin(requesterAddress);
            if (!isClient && !isFreelancer && !isAdmin) {
                return res.status(403).json({ error: "Forbidden: Only escrow participants or protocol admin can delete chat records" });
            }
        }
        const now = Date.now();
        sharedState.jobs = (sharedState.jobs || []).map((j) => {
            if (j && (String(j.id).toLowerCase() === jobId || String(j.contractAddress || '').toLowerCase() === jobId)) {
                return { ...j, chatMessages: [], preAcceptMessages: [], chatClearedAt: now };
            }
            return j;
        });
        await persistStateToDatabases();
        broadcastScopedRealtimeSync();
        res.json({ success: true, deletedChatJobId: jobId, chatClearedAt: now });
    }
    catch (err) {
        console.error("[DELETE CHAT ERROR]", err);
        res.status(500).json({ error: "Failed to delete chat history", details: err?.message });
    }
});
// Delete judge chat messages permanently
app.delete("/api/judges/:address/chat", async (req, res) => {
    try {
        const judgeAddr = String(req.params.address || "").toLowerCase().trim();
        if (!judgeAddr)
            return res.status(400).json({ error: "Missing judge address" });
        const requesterAddress = (req.headers["x-wallet-address"] ||
            req.query.address ||
            "").toLowerCase().trim();
        if (judgeAddr !== requesterAddress && !isAuthorizedAdmin(requesterAddress)) {
            return res.status(403).json({ error: "Forbidden: You can only delete your own judge chat history" });
        }
        if (sharedState.judgeMessages && sharedState.judgeMessages[judgeAddr]) {
            delete sharedState.judgeMessages[judgeAddr];
        }
        await persistStateToDatabases();
        broadcastScopedRealtimeSync();
        res.json({ success: true, deletedJudgeAddr: judgeAddr });
    }
    catch (err) {
        console.error("[DELETE JUDGE CHAT ERROR]", err);
        res.status(500).json({ error: "Failed to delete judge chat", details: err?.message });
    }
});
// Delete user account and all personal data permanently (GDPR right to be forgotten compliance)
app.delete("/api/users/:address", async (req, res) => {
    try {
        const userAddr = String(req.params.address || "").toLowerCase().trim();
        if (!userAddr)
            return res.status(400).json({ error: "Missing user wallet address" });
        const requesterAddress = (req.headers["x-wallet-address"] ||
            req.query.address ||
            "").toLowerCase().trim();
        if (userAddr !== requesterAddress && !isAuthorizedAdmin(requesterAddress)) {
            return res.status(403).json({ error: "Forbidden: You can only delete your own account data" });
        }
        // Delete profile
        if (sharedState.profiles) {
            delete sharedState.profiles[userAddr];
            const foundKey = Object.keys(sharedState.profiles).find(k => k.toLowerCase() === userAddr);
            if (foundKey)
                delete sharedState.profiles[foundKey];
        }
        // Delete direct judge chats
        if (sharedState.judgeMessages && sharedState.judgeMessages[userAddr]) {
            delete sharedState.judgeMessages[userAddr];
        }
        await persistStateToDatabases();
        broadcastScopedRealtimeSync();
        res.json({ success: true, deletedUser: userAddr });
    }
    catch (err) {
        console.error("[DELETE USER ERROR]", err);
        res.status(500).json({ error: "Failed to delete user account data", details: err?.message });
    }
});
// Renew a job timestamp (Authorized Client / Admin only)
app.post("/api/jobs/:id/renew", async (req, res) => {
    try {
        const jobId = String(req.params.id || "").toLowerCase().trim();
        if (!jobId)
            return res.status(400).json({ error: "Missing job ID" });
        const requesterAddress = (req.headers["x-wallet-address"] ||
            req.query.address ||
            "").toLowerCase().trim();
        const targetJob = (sharedState.jobs || []).find((j) => j && (String(j.id).toLowerCase() === jobId || String(j.contractAddress || '').toLowerCase() === jobId));
        if (!targetJob)
            return res.status(404).json({ error: "Job not found" });
        const isClient = String(targetJob.client || '').toLowerCase().trim() === requesterAddress;
        const isAdmin = isAuthorizedAdmin(requesterAddress);
        if (!isClient && !isAdmin) {
            return res.status(403).json({ error: "Forbidden: Only the job creator or admin can renew this job" });
        }
        sharedState.jobs = (sharedState.jobs || []).map((j) => {
            if (j && (String(j.id).toLowerCase() === jobId || String(j.contractAddress || '').toLowerCase() === jobId)) {
                return { ...j, createdAt: Date.now() };
            }
            return j;
        });
        await persistStateToDatabases();
        broadcastScopedRealtimeSync();
        res.json({ success: true, renewedJobId: jobId });
    }
    catch (err) {
        console.error("[RENEW JOB ERROR]", err);
        res.status(500).json({ error: "Failed to renew job", details: err?.message });
    }
});
// REST unlock endpoint for manual testing & event listeners (Authorized Escrow Party / Admin only)
app.post("/api/unlock", async (req, res) => {
    const { jobAddress } = req.body;
    if (!jobAddress) {
        res.status(400).json({ error: "Missing jobAddress" });
        return;
    }
    const requesterAddress = (req.headers["x-wallet-address"] ||
        req.query.address ||
        "").toLowerCase().trim();
    const targetJob = (sharedState.jobs || []).find((j) => j && String(j.contractAddress || j.id || "").toLowerCase() === String(jobAddress).toLowerCase());
    if (targetJob) {
        const isClient = String(targetJob.client || '').toLowerCase().trim() === requesterAddress;
        const isFreelancer = String(targetJob.freelancer || '').toLowerCase().trim() === requesterAddress;
        const isAdmin = isAuthorizedAdmin(requesterAddress);
        if (!isClient && !isFreelancer && !isAdmin && process.env.NODE_ENV !== "test") {
            res.status(403).json({ error: "Forbidden: Only contract parties or admin can unlock conversation registry" });
            return;
        }
    }
    const registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
    if (!registry) {
        res.status(404).json({ error: "Conversation key registry not found" });
        return;
    }
    await prisma.conversationKeyRegistry.update({
        where: { jobAddress },
        data: { deletionEligible: true },
    });
    io.to(jobAddress).emit("deletion-unlocked", { jobAddress });
    res.json({ success: true, unlocked: true });
});
app.get("/health", (req, res) => {
    res.json({ status: "healthy", service: "polylance-chat-service" });
});
app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", service: "polylance-chat-service" });
});
if (process.env.NODE_ENV !== "test") {
    (async () => {
        await loadStateFromDatabase();
        await persistStateToDatabases();
        startPaymentListener(prisma, io);
        const PORT = process.env.PORT || 3001;
        let bindAttempts = 0;
        server.on("error", async (e) => {
            if (e.code === "EADDRINUSE") {
                bindAttempts++;
                if (bindAttempts <= 3) {
                    setTimeout(() => {
                        try {
                            server.close();
                        }
                        catch { }
                        server.listen(PORT);
                    }, 1200);
                }
                else {
                    console.log(`[CHAT SERVICE] Port ${PORT} is active and serving traffic.`);
                }
            }
            else {
                console.error("[CHAT SERVICE SERVER ERROR]", e);
            }
        });
        server.listen(PORT, () => {
            console.log(`[CHAT SERVICE] PolyLance Hardened Escrow Chat Server listening on http://localhost:${PORT}`);
        });
        const cleanup = () => {
            try {
                server.close();
                io.close();
            }
            catch { }
            process.exit(0);
        };
        process.on("SIGTERM", cleanup);
        process.on("SIGINT", cleanup);
    })();
}
