import { Request, Response, Router } from "express";
import { requireAuth } from "./auth.js";

export interface FeeDue {
  id: string;
  jobId: string;
  engagementId?: string;
  party: 'CLIENT' | 'FREELANCER';
  wallet: string;
  token: string;
  expectedFee: string;  // bigint string (wei / base units)
  paidFee: string;      // bigint string
  outstanding: string;  // bigint string
  status: 'NOT_DUE' | 'DUE' | 'PAYMENT_PENDING' | 'PAID' | 'UNDER_REVIEW' | 'WAIVED' | 'RECOVERY';
  evidence: {
    txHashes?: string[];
    blockNumbers?: number[];
    classificationReason?: string;
    submittedTxHash?: string;
    submittedAt?: number;
    confirmedAt?: number;
  };
  reasonCode: string;
  dueSince: number;
  lastReminderAt?: number;
  reminderCount: number;
  settlementTxHash?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  idempotencyKey?: string;
  createdAt: number;
  updatedAt: number;
}

export const FEE_DUES_CONFIG = {
  ENABLED: process.env.FEE_DUES_ENABLED === "true", // Default: false
  DUST_THRESHOLD_WEI: 10000000000000000n, // 0.01 POL
  DUST_THRESHOLD_USDC: 10000n,            // 0.01 USDC (6 decimals)
  REMINDER_SCHEDULE_DAYS: [0, 3, 7, 14, 21, 28],
  MAX_REMINDERS: 5,
  TREASURY_ADDRESS: (process.env.TREASURY_ADDRESS || "0x940D3DE5F6fe25950d753b890C36676cf237653F").toLowerCase(),
};

// In-memory / shared state collection of fee dues
export const feeDuesStore = new Map<string, FeeDue>();

export const feeDuesRouter = Router();

// GET /api/fees/config - Return feature flag and public config
feeDuesRouter.get("/config", (_req: Request, res: Response) => {
  res.json({
    enabled: FEE_DUES_CONFIG.ENABLED,
    treasuryAddress: FEE_DUES_CONFIG.TREASURY_ADDRESS,
  });
});

// GET /api/fees/my-dues - Retrieve dues for the connected wallet
feeDuesRouter.get("/my-dues", requireAuth, (req: Request, res: Response) => {
  if (!FEE_DUES_CONFIG.ENABLED) {
    return res.json({ dues: [], totalOutstanding: {}, enabled: false });
  }

  const wallet = req.session?.wallet || "";
  if (!wallet) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const userDues = Array.from(feeDuesStore.values()).filter(
    (d) => d.wallet.toLowerCase() === wallet && d.status !== 'NOT_DUE' && d.status !== 'RECOVERY'
  );

  res.json({
    dues: userDues,
    enabled: true,
  });
});

// POST /api/fees/:dueId/intent - Create or fetch payment intent
feeDuesRouter.post("/:dueId/intent", requireAuth, (req: Request, res: Response) => {
  if (!FEE_DUES_CONFIG.ENABLED) {
    return res.status(403).json({ error: "Platform fees dues feature is currently inactive" });
  }

  const dueId = String(req.params.dueId || "").trim();
  const wallet = req.session?.wallet || "";

  const due = feeDuesStore.get(dueId);
  if (!due) {
    return res.status(404).json({ error: "Fee due record not found" });
  }

  if (due.wallet.toLowerCase() !== wallet) {
    return res.status(403).json({ error: "Only the owing wallet can initiate payment for this fee due" });
  }

  if (due.status === 'PAID') {
    return res.status(409).json({ error: "Fee is already paid" });
  }

  res.json({
    success: true,
    dueId: due.id,
    jobId: due.jobId,
    token: due.token,
    outstanding: due.outstanding,
    treasuryAddress: FEE_DUES_CONFIG.TREASURY_ADDRESS,
  });
});

// POST /api/fees/:dueId/submitted - Record broadcasted payment transaction
feeDuesRouter.post("/:dueId/submitted", requireAuth, (req: Request, res: Response) => {
  if (!FEE_DUES_CONFIG.ENABLED) {
    return res.status(403).json({ error: "Platform fees dues feature is currently inactive" });
  }

  const dueId = String(req.params.dueId || "").trim();
  const txHash = String(req.body?.txHash || "").toLowerCase().trim();
  const wallet = req.session?.wallet || "";

  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return res.status(400).json({ error: "Valid transaction hash required" });
  }

  const due = feeDuesStore.get(dueId);
  if (!due) {
    return res.status(404).json({ error: "Fee due record not found" });
  }

  if (due.wallet.toLowerCase() !== wallet) {
    return res.status(403).json({ error: "Unauthorized wallet" });
  }

  due.status = 'PAYMENT_PENDING';
  due.evidence.submittedTxHash = txHash;
  due.evidence.submittedAt = Date.now();
  due.updatedAt = Date.now();
  feeDuesStore.set(dueId, due);

  res.json({ success: true, due });
});

// POST /api/fees/:dueId/report-problem - Dispute a due and pause reminders
feeDuesRouter.post("/:dueId/report-problem", requireAuth, (req: Request, res: Response) => {
  const dueId = String(req.params.dueId || "").trim();
  const note = String(req.body?.note || "").trim();
  const wallet = req.session?.wallet || "";

  const due = feeDuesStore.get(dueId);
  if (!due) {
    return res.status(404).json({ error: "Fee due record not found" });
  }

  if (due.wallet.toLowerCase() !== wallet) {
    return res.status(403).json({ error: "Unauthorized wallet" });
  }

  due.status = 'UNDER_REVIEW';
  due.resolutionNote = note || "User reported problem / disputed due";
  due.updatedAt = Date.now();
  feeDuesStore.set(dueId, due);

  res.json({ success: true, due, message: "Fee due placed UNDER_REVIEW. Reminders paused." });
});
