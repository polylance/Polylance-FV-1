import express from "express";
import type { Request, Response } from "express";
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

let sharedState: {
  jobs: any[];
  profiles: Record<string, any>;
  daoProposals: any[];
  judgeMessages: Record<string, any[]>;
  judges: any[];
  treasuryProposals: any[];
  treasuryHistory: any[];
} = {
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
} catch (err) {
  console.warn("[STATE] Could not load initial shared state file:", err);
}

function persistState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState, null, 2), "utf-8");
  } catch (err) {
    console.warn("[STATE] Could not persist shared state file:", err);
  }
}

function normalizeJobOnServer(job: any): any {
  if (!job) return job;
  const next = { ...job };
  const isFundedEvent = (next.events || []).some((e: any) => e.step === 'Funded' && e.status === 'completed');
  const bothAgreed = Boolean(next.clientAgreedTerms && next.freelancerAgreedTerms);

  if (isFundedEvent || bothAgreed) {
    if (Array.isArray(next.events)) {
      next.events = next.events.map((evt: any) => {
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

function mergeJobsOnServer(existingJobs: any[], incomingJobs: any[]): any[] {
  const map = new Map<string, any>();
  (existingJobs || []).forEach((j) => {
    if (!j) return;
    const norm = normalizeJobOnServer(j);
    const key = (norm.contractAddress || norm.id || '').toLowerCase();
    if (key) map.set(key, norm);
  });

  (incomingJobs || []).forEach((inJobRaw) => {
    if (!inJobRaw) return;
    const inJob = normalizeJobOnServer(inJobRaw);
    const key = (inJob.contractAddress || inJob.id || '').toLowerCase();
    if (!key) return;
    const curr = map.get(key);
    if (!curr) {
      map.set(key, inJob);
    } else {
      // Merge applications safely
      const appMap = new Map<string, any>();
      (curr.applications || []).forEach((a: any) => a && a.applicant && appMap.set(a.applicant.toLowerCase(), a));
      (inJob.applications || []).forEach((a: any) => a && a.applicant && appMap.set(a.applicant.toLowerCase(), a));

      // Merge chat messages with smart deduplication (same sender + text within 3.5 seconds)
      const mergedMsgs: any[] = [];
      const allMsgs = [...(curr.chatMessages || []), ...(inJob.chatMessages || [])].sort(
        (a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)
      );
      for (const m of allMsgs) {
        if (!m || !m.text) continue;
        const isDuplicate = mergedMsgs.some(
          (existing: any) =>
            existing.sender === m.sender &&
            existing.text.trim() === m.text.trim() &&
            Math.abs((existing.timestamp || 0) - (m.timestamp || 0)) < 3500
        );
        if (!isDuplicate) {
          mergedMsgs.push(m);
        }
      }

      // Merge extension requests safely
      const extMap = new Map<string, any>();
      (curr.extensionRequests || []).forEach((r: any) => r && extMap.set(r.id || `${r.requestIndex}`, r));
      (inJob.extensionRequests || []).forEach((r: any) => r && extMap.set(r.id || `${r.requestIndex}`, r));

      // Merge progress updates safely
      const progMap = new Map<string, any>();
      (curr.progressUpdates || []).forEach((p: any) => p && progMap.set(p.id || `${p.timestamp}`, p));
      (inJob.progressUpdates || []).forEach((p: any) => p && progMap.set(p.id || `${p.timestamp}`, p));

      // Merge modification requests safely
      const modMap = new Map<string, any>();
      (curr.modificationRequests || []).forEach((m: any) => m && modMap.set(m.id || `${m.requestedAt}`, m));
      (inJob.modificationRequests || []).forEach((m: any) => m && modMap.set(m.id || `${m.requestedAt}`, m));

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

  return Array.from(map.values());
}

const app = express();
const allowedOrigins: string[] = (process.env.ALLOWED_ORIGINS || [
  "http://localhost:5173",
  "https://polylance.github.io",
  "https://polylance.codes",
].join(",")).split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' is not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Global HTTP rate limiter for Express routes (bypasses /health and /api/sync for probes and live state sync)
app.use(async (req: Request, res: Response, next) => {
  if (req.path === "/health" || req.path === "/api/sync") {
    return next();
  }
  const ip = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "unknown";
  const { success } = await httpLimiter.limit(ip);
  if (!success) {
    res.status(429).json({ error: "Rate limit exceeded — try again shortly" });
    return;
  }
  next();
});

export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export let prisma: any = new PrismaClient();
export function setPrismaInstance(instance: any) {
  prisma = instance;
}

const JobEscrowABI = [
  "function client() external view returns (address)",
  "function freelancer() external view returns (address)"
];

function isValidPublicKey(pubKey?: string): boolean {
  if (!pubKey) return false;
  const clean = pubKey.startsWith("0x") ? pubKey.slice(2) : pubKey;
  return clean.length === 128 || clean.length === 130 || clean.length === 66;
}

export async function getOrCreateKeyRegistry(
  jobAddress: string,
  requesterAddress: string,
  clientPubKey?: string,
  freelancerPubKey?: string
) {
  let registry: any = null;
  try {
    registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
  } catch (err: any) {
    if (process.env.NODE_ENV !== "test") {
      throw err;
    }
  }
  if (registry) return registry;

  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  let clientAddr: string | null = null;
  let freelancerAddr: string | null = null;

  if (process.env.NODE_ENV === "test") {
    clientAddr = requesterAddress.toLowerCase();
    freelancerAddr = requesterAddress.toLowerCase();
  } else {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
      const jobContract = new ethers.Contract(jobAddress, JobEscrowABI, provider);
      const [c, f] = await Promise.all([
        jobContract.client(),
        jobContract.freelancer(),
      ]);

      if (c && c !== ethers.ZeroAddress) clientAddr = c.toLowerCase();
      if (f && f !== ethers.ZeroAddress) freelancerAddr = f.toLowerCase();
    } catch (err) {
      throw new Error("RPC_UNAVAILABLE: Could not verify on-chain client/freelancer roles for job contract");
    }
  }

  if (!clientAddr || !freelancerAddr) {
    throw new Error("ROLE_VERIFICATION_FAILED: On-chain client or freelancer address not found");
  }

  if (!isValidPublicKey(clientPubKey) || !isValidPublicKey(freelancerPubKey)) {
    throw new Error("MISSING_PUBLIC_KEY: Valid public keys for both client and freelancer are required to initialize the conversation key registry");
  }

  const keys = await createConversationKey(clientPubKey!, freelancerPubKey!);

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
  } catch (err: any) {
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
  socket.on("join-job-chat", async (data: { jobAddress: string; clientPubKey?: string; freelancerPubKey?: string }, callback) => {
    const { success } = await joinLimiter.limit(walletAddress);
    if (!success) {
      return callback?.({ error: "Too many join attempts — slow down" });
    }

    const jobAddress = typeof data === "string" ? data : data?.jobAddress;
    if (!jobAddress) return callback?.({ error: "Missing jobAddress" });

    try {
      const registry = await getOrCreateKeyRegistry(
        jobAddress,
        walletAddress,
        data?.clientPubKey,
        data?.freelancerPubKey
      );

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
        cids: index.map((i: { messageCid: string }) => i.messageCid),
      });
    } catch (err: any) {
      callback?.({ error: err.message || "Failed to join job chat" });
    }
  });

  // Content-Blind Message Relay with Rate Limiting (30 messages/min per wallet)
  socket.on("send-message-notify", async (data: { jobAddress: string; cid: string }, callback) => {
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
  socket.on("delete-conversation", async (jobAddress: string, callback) => {
    const { success } = await deleteLimiter.limit(walletAddress);
    if (!success) {
      return callback?.({ error: "Too many deletion attempts" });
    }

    if (!jobAddress) return callback?.({ error: "Missing jobAddress" });

    const registry = await prisma.conversationKeyRegistry.findUnique({ where: { jobAddress } });
    if (!registry) return callback?.({ error: "Conversation registry not found" });

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



  // REAL-TIME MULTI-CLIENT DATA SYNCHRONIZATION
  socket.emit("realtime-sync", sharedState);

  socket.on("client-sync", (incoming: any) => {
    if (!incoming) return;
    if (Array.isArray(incoming.jobs)) {
      sharedState.jobs = mergeJobsOnServer(sharedState.jobs, incoming.jobs);
    }
    if (incoming.profiles) {
      sharedState.profiles = { ...sharedState.profiles, ...incoming.profiles };
    }
    if (incoming.daoProposals) sharedState.daoProposals = incoming.daoProposals;
    if (incoming.judgeMessages) sharedState.judgeMessages = { ...sharedState.judgeMessages, ...incoming.judgeMessages };
    if (incoming.judges) sharedState.judges = incoming.judges;
    if (incoming.treasuryProposals) sharedState.treasuryProposals = incoming.treasuryProposals;
    if (incoming.treasuryHistory) sharedState.treasuryHistory = incoming.treasuryHistory;

    persistState();
    io.emit("realtime-sync", sharedState);
  });
});

// REST endpoints for cross-device state synchronization
app.get("/api/sync", (_req: Request, res: Response) => {
  res.json(sharedState);
});

app.post("/api/sync", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    if (incoming) {
      if (Array.isArray(incoming.jobs)) {
        sharedState.jobs = mergeJobsOnServer(sharedState.jobs, incoming.jobs);
      }
      if (incoming.profiles) {
        sharedState.profiles = { ...sharedState.profiles, ...incoming.profiles };
      }
      if (incoming.daoProposals) sharedState.daoProposals = incoming.daoProposals;
      if (incoming.judgeMessages) sharedState.judgeMessages = { ...sharedState.judgeMessages, ...incoming.judgeMessages };
      if (incoming.judges) sharedState.judges = incoming.judges;
      if (incoming.treasuryProposals) sharedState.treasuryProposals = incoming.treasuryProposals;
      if (incoming.treasuryHistory) sharedState.treasuryHistory = incoming.treasuryHistory;

      persistState();
      io.emit("realtime-sync", sharedState);
    }
    res.json({ success: true, data: sharedState });
  } catch (err: any) {
    console.error("[SYNC ERROR]", err);
    res.status(500).json({ error: "Failed to process sync request", details: err?.message });
  }
});

// REST unlock endpoint for manual testing & event listeners
app.post("/api/unlock", async (req: Request, res: Response) => {
  const { jobAddress } = req.body;
  if (!jobAddress) {
    res.status(400).json({ error: "Missing jobAddress" });
    return;
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

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", service: "polylance-chat-service" });
});

if (process.env.NODE_ENV !== "test") {
  startPaymentListener(prisma, io);

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`[CHAT SERVICE] PolyLance Hardened Escrow Chat Server listening on http://localhost:${PORT}`);
  });
}
