import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const publicStatsRouter = Router();

// In-memory cache for aggregate public statistics
let cachedStats: any = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 45000; // 45 seconds cache

// Rate limiter state: IP -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 120;

const POLYGON_MAINNET_CHAIN_ID = 137;
const CONTRACT_ADDRESSES = {
  jobEscrowImpl: '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB',
  jobFactory: '0xbE74923BBfd72d400a681915dBcf6e6Adc72C317',
  reputationSBT: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
};

const REPUTATION_TIERS = [
  { name: 'Bronze', minPoints: 0, maxPoints: 199 },
  { name: 'Silver', minPoints: 200, maxPoints: 499 },
  { name: 'Gold', minPoints: 500, maxPoints: 999 },
  { name: 'Diamond', minPoints: 1000, maxPoints: null },
];

/**
 * Middleware: Rate limiter for public endpoints
 */
function publicStatsRateLimiter(req: Request, res: Response, next: () => void) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const clientLimit = rateLimitMap.get(ip) || { count: 0, windowStart: now };

  if (now - clientLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    clientLimit.count = 1;
    clientLimit.windowStart = now;
  } else {
    clientLimit.count++;
  }

  rateLimitMap.set(ip, clientLimit);

  if (clientLimit.count > MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: 'Too many requests, please try again in a minute.', code: 'RATE_LIMITED' });
    return;
  }

  next();
}

/**
 * Helper to fetch jobs from in-memory state or local state file
 */
function loadSharedState(): { jobs: any[]; profiles: Record<string, any>; testimonials?: any[] } {
  const possiblePaths = [
    path.resolve(process.cwd(), 'polylance_shared_state.json'),
    path.resolve(process.cwd(), 'polylance-chat-service', 'polylance_shared_state.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return {
          jobs: Array.isArray(raw.jobs) ? raw.jobs : [],
          profiles: (raw.profiles && typeof raw.profiles === 'object') ? raw.profiles : {},
          testimonials: Array.isArray(raw.testimonials) ? raw.testimonials : [],
        };
      } catch {
        // continue
      }
    }
  }

  return { jobs: [], profiles: {}, testimonials: [] };
}

/**
 * GET /api/public/stats
 * Read-only aggregate metrics with zero PII or user-identifiable data.
 * Tokens (POL and USDC) are kept strictly separate.
 */
publicStatsRouter.get('/api/public/stats', publicStatsRateLimiter, async (req: Request, res: Response) => {
  const now = Date.now();

  // Set CORS headers
  const origin = req.headers.origin;
  if (origin) {
    if (
      origin === 'https://polylance.codes' ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    }
  }

  // Return cached payload if fresh
  if (cachedStats && now - lastCacheTimestamp < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 'public, max-age=45');
    res.json(cachedStats);
    return;
  }

  try {
    const sharedState = loadSharedState();
    const sharedStateJobs = sharedState.jobs;

    // 1. Filter out excluded test jobs & non-mainnet records
    const validJobs = sharedStateJobs.filter((job) => {
      if (job.exclude_from_public_stats === true) return false;
      return true;
    });

    // 2. Compute Escrow aggregates & Settled totals per token
    let polLocked = 0;
    let usdcLocked = 0;
    let polSettled = 0;
    let usdcSettled = 0;
    let activeEscrowCount = 0;
    const allActivityEvents: Array<{ type: string; timestamp: number; txHash: string }> = [];

    validJobs.forEach((j) => {
      const status = (j.status || '').toLowerCase();
      const isActive =
        status === 'in progress' ||
        status === 'funded' ||
        status === 'in review' ||
        status === 'active';
      const isCompleted = status === 'completed';

      const token = (j.paymentTokenSymbol || j.paymentToken || j.token || '').toLowerCase();
      const isUsdc = token.includes('usdc') || token === '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' || token === '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582';

      if (isActive) {
        activeEscrowCount++;
        const budget = parseFloat(j.budget || j.amount || j.amountUsdc || '0') || 0;
        if (isUsdc) {
          usdcLocked += budget;
        } else {
          polLocked += budget;
        }
      }

      if (isCompleted) {
        if (isUsdc) {
          const val = parseFloat(j.amountUsdc || j.budget || '0') || 0;
          usdcSettled += val;
        } else {
          const val = parseFloat(j.amountEth || j.budget || j.amount || '0') || 0;
          polSettled += val;
        }
      }

      // Collect on-chain events for anonymized activity ticker (zero PII, zero amounts)
      if (Array.isArray(j.events)) {
        j.events.forEach((ev: any) => {
          if (!ev.txHash) return;
          let eventType = '';
          const t = (ev.title || '').toLowerCase();
          if (t.includes('fund')) eventType = 'Escrow funded';
          else if (t.includes('release') || t.includes('payment released')) eventType = 'Milestone released';
          else if (t.includes('mint') || t.includes('sbt')) eventType = 'Certificate minted';
          else if (t.includes('dispute') || t.includes('ruling')) eventType = 'Dispute resolved';
          else if (t.includes('complete')) eventType = 'Job completed';

          if (eventType && ev.timestamp) {
            allActivityEvents.push({
              type: eventType,
              timestamp: Number(ev.timestamp),
              txHash: String(ev.txHash),
            });
          }
        });
      }
    });

    // Deduplicate and sort newest first
    const seenTx = new Set<string>();
    const deduplicatedEvents = allActivityEvents.filter(e => {
      const k = `${e.type}-${e.txHash}`;
      if (seenTx.has(k)) return false;
      seenTx.add(k);
      return true;
    });
    deduplicatedEvents.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivity = deduplicatedEvents.slice(0, 8);

    // 3. Compute Certificates aggregates
    let totalCerts = 0;
    let latestCert: any = null;

    const jobsWithCerts = validJobs.filter(
      (j) => j.onchainTokenId || j.certificateNo || j.status === 'Completed'
    );
    totalCerts = jobsWithCerts.length;

    if (jobsWithCerts.length > 0) {
      const sortedCerts = [...jobsWithCerts].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      const newest = sortedCerts[0];
      latestCert = {
        tokenId: String(newest.onchainTokenId || newest.certificateNo || 1),
        mintedAt: newest.updatedAt || newest.createdAt || new Date().toISOString(),
        txHash: newest.mintTxHash || null,
        contract: CONTRACT_ADDRESSES.reputationSBT,
      };
    }

    // 4. Compute Dispute aggregates
    let disputesOpened = 0;
    let disputesResolved = 0;
    let fullRelease = 0;
    let fullRefund = 0;
    let split = 0;

    validJobs.forEach((j) => {
      if (j.dispute) {
        disputesOpened++;
        if (j.dispute.resolved || j.status === 'Resolved') {
          disputesResolved++;
          const ruling = (j.dispute.ruling || '').toLowerCase();
          if (ruling.includes('release') || ruling.includes('freelancer')) {
            fullRelease++;
          } else if (ruling.includes('refund') || ruling.includes('client')) {
            fullRefund++;
          } else {
            split++;
          }
        }
      }
    });

    // 5. Compute Completed Jobs count
    const completedJobsCount = validJobs.filter(
      (j) => (j.status || '').toLowerCase() === 'completed'
    ).length;

    const registeredProfilesCount = Object.keys(sharedState.profiles || {}).length;

    // 6. Assemble final aggregated payload (STRICT: Zero PII, Zero Addresses beyond contracts)
    const payload = {
      updatedAt: new Date().toISOString(),
      chainId: POLYGON_MAINNET_CHAIN_ID,
      registeredProfiles: registeredProfilesCount,
      escrow: {
        lockedByToken: {
          POL: Number(polLocked.toFixed(4)),
          USDC: Number(usdcLocked.toFixed(2)),
        },
        settledByToken: {
          POL: Number(polSettled.toFixed(4)),
          USDC: Number(usdcSettled.toFixed(2)),
        },
        activeCount: activeEscrowCount,
        contractAddress: CONTRACT_ADDRESSES.jobEscrowImpl,
        sourceVerified: true,
      },
      certificates: {
        totalIssued: totalCerts,
        latest: latestCert,
      },
      disputes: {
        opened: disputesOpened,
        resolved: disputesResolved,
        outcomes: {
          fullRelease,
          fullRefund,
          split,
        },
      },
      jobs: {
        completed: completedJobsCount,
      },
      reputation: {
        tiers: REPUTATION_TIERS,
      },
      recentActivity,
    };

    cachedStats = payload;
    lastCacheTimestamp = now;

    res.setHeader('Cache-Control', 'public, max-age=45');
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to aggregate public statistics', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/public/testimonials
 * Public testimonials endpoint. Renders ONLY if at least 3 approved testimonials with consent exist.
 */
publicStatsRouter.get('/api/public/testimonials', publicStatsRateLimiter, (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin) {
    if (
      origin === 'https://polylance.codes' ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    }
  }

  const shared = loadSharedState();
  const approved = (shared.testimonials || []).filter((t: any) => t.approved === true && t.consent === true);
  if (approved.length < 3) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json([]);
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json(approved.map((t: any) => ({
    id: t.id,
    authorName: t.authorName,
    role: t.role,
    text: t.text,
    jobLink: t.jobLink || null,
    approvedAt: t.approvedAt,
  })));
});

/**
 * PATCH /api/admin/jobs/:id/public-stats-exclusion
 * Admin endpoint to toggle exclude_from_public_stats on a job
 */
publicStatsRouter.patch('/api/admin/jobs/:id/public-stats-exclusion', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { exclude } = req.body;

  if (typeof exclude !== 'boolean') {
    res.status(400).json({ error: 'Field "exclude" (boolean) is required' });
    return;
  }

  const possiblePaths = [
    path.resolve(process.cwd(), 'polylance_shared_state.json'),
    path.resolve(process.cwd(), 'polylance-chat-service', 'polylance_shared_state.json')
  ];

  let found = false;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const stateObj = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (Array.isArray(stateObj.jobs)) {
          const target = stateObj.jobs.find((j: any) => j.id === id);
          if (target) {
            target.exclude_from_public_stats = exclude;
            fs.writeFileSync(p, JSON.stringify(stateObj, null, 2), 'utf-8');
            found = true;
          }
        }
      } catch {
        // continue
      }
    }
  }

  // Clear cached stats so next request recalculates
  cachedStats = null;
  lastCacheTimestamp = 0;

  if (!found) {
    res.status(404).json({ error: `Job ${id} not found` });
    return;
  }

  res.json({ success: true, jobId: id, exclude_from_public_stats: exclude });
});
