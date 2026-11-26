import { calculateReputationPercentile } from './formatters.js';
import {
  TAXONOMY_CATEGORIES,
  LEGACY_CATEGORY_MAP,
  findTaxonomyCategory,
  validateAndResolveJobCategories,
} from './taxonomy.js';

export const LEADERBOARD_CACHE_TTL_MS = 30 * 1000; // 30 seconds short-lived cache

export interface LeaderboardEntry {
  rank: number;
  address: string;
  display_name: string;
  category_id: string | null;
  category_slug: string | null;
  category_name: string;
  reputation_points: number;
  completed_jobs_count: number;
  verified_sbts_count: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  percentile: string;
}

export interface MyRankSummary {
  address: string;
  rank: number | null;
  totalParticipants: number;
  inLeaderboard: boolean;
  reputation_points: number;
  completed_jobs_count: number;
  verified_sbts_count: number;
  category_id: string | null;
  percentile: string;
}

export interface TopByCategoryGroup {
  category_id: string;
  category_slug: string;
  category_name: string;
  track: string;
  total_ranked: number;
  top: LeaderboardEntry[];
}

interface CachedSnapshot {
  entries: LeaderboardEntry[];
  builtAt: number;
  expiresAt: number;
}

let leaderboardCache: CachedSnapshot | null = null;

export function invalidateLeaderboardCache(): void {
  leaderboardCache = null;
}

function getReputationTier(points: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' {
  if (points >= 1000) return 'Diamond';
  if (points >= 500) return 'Gold';
  if (points >= 200) return 'Silver';
  return 'Bronze';
}

const COMPLETED_JOB_STATUSES = new Set([
  'completed',
  'paid',
  'released',
  'approved',
  'settled',
  'resolved',
]);

function resolveProfileCategory(
  profile: any,
  completedJobCategories: string[]
): { id: string | null; slug: string | null; name: string } {
  const candidates = [
    profile?.primaryCategoryId,
    profile?.primary_category_id,
    profile?.categoryId,
    profile?.category,
    ...completedJobCategories,
  ].filter(Boolean);

  for (const raw of candidates) {
    const clean = String(raw).trim();
    const direct = findTaxonomyCategory(clean);
    if (direct) {
      return { id: direct.id, slug: direct.slug, name: direct.name };
    }
    const legacy = LEGACY_CATEGORY_MAP[clean.toLowerCase()];
    if (legacy) {
      const mapped = findTaxonomyCategory(legacy.categoryId);
      if (mapped) {
        return { id: mapped.id, slug: mapped.slug, name: mapped.name };
      }
    }
  }

  return { id: null, slug: null, name: 'Uncategorized' };
}

/**
 * Aggregates real on-chain / completed-escrow reputation points joined with profile categories.
 * Strictly NEVER reads `profileScores` (Part 4 demo score cannot influence leaderboard ranking).
 */
export async function buildOrGetLeaderboardEntries(params: {
  sharedState: any;
  prisma?: any;
  bypassCache?: boolean;
}): Promise<{ entries: LeaderboardEntry[]; cached: boolean; queryMs: number }> {
  const startNs = process.hrtime.bigint();
  const now = Date.now();

  if (!params.bypassCache && leaderboardCache && leaderboardCache.expiresAt > now) {
    const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    return {
      entries: leaderboardCache.entries,
      cached: true,
      queryMs: Number(elapsedMs.toFixed(3)),
    };
  }

  const jobs: any[] = Array.isArray(params.sharedState?.jobs) ? params.sharedState.jobs : [];
  const profiles: Record<string, any> =
    params.sharedState?.profiles && typeof params.sharedState.profiles === 'object'
      ? params.sharedState.profiles
      : {};

  // Accumulators keyed by normalized lowercase wallet address
  const completedCountByWallet = new Map<string, number>();
  const completedCatsByWallet = new Map<string, string[]>();
  const sbtsCountByWallet = new Map<string, number>();
  const explicitPointsByWallet = new Map<string, number>();

  for (const job of jobs) {
    if (!job) continue;
    const status = String(job.status || '').toLowerCase().trim();
    if (!COMPLETED_JOB_STATUSES.has(status)) continue;

    const freelancer = String(job.freelancer || '').toLowerCase().trim();
    if (!freelancer || !/^0x[a-f0-9]{40}$/.test(freelancer)) continue;

    completedCountByWallet.set(freelancer, (completedCountByWallet.get(freelancer) || 0) + 1);

    const resolvedJobCat = validateAndResolveJobCategories(
      {
        categoryId: job.categoryId,
        subcategoryId: job.subcategoryId,
        category: job.category,
        subcategory: job.subcategory,
      },
      { strictExplicit: false }
    );
    if (resolvedJobCat.categoryId) {
      const list = completedCatsByWallet.get(freelancer) || [];
      list.push(resolvedJobCat.categoryId);
      completedCatsByWallet.set(freelancer, list);
    }

    if (job.sbtMinted || job.tokenId !== undefined || job.onchainTokenId !== undefined) {
      sbtsCountByWallet.set(freelancer, (sbtsCountByWallet.get(freelancer) || 0) + 1);
    }
  }

  // Optional indexed SQL overlay once Migrations 0001 & 0005 have been applied to PostgreSQL.
  // Before production migration approval, avoid querying un-migrated columns on every cold miss
  // (loadStateFromDatabase already hydrates jobs, profiles, and onchainTokenId/certificateNo in memory).
  const enableSqlOverlay = process.env.ENABLE_LEADERBOARD_SQL_OVERLAY === 'true';

  if (enableSqlOverlay && params.prisma?.certificateRecord) {
    try {
      const dbCerts = await params.prisma.certificateRecord.findMany({
        where: {
          certType: 'Verified Work',
          status: { in: ['Minted', 'Verified', 'Active'] },
        },
        select: { holderWallet: true },
      });
      if (Array.isArray(dbCerts)) {
        const dbCounts = new Map<string, number>();
        for (const c of dbCerts) {
          const w = String(c.holderWallet || '').toLowerCase().trim();
          if (w) dbCounts.set(w, (dbCounts.get(w) || 0) + 1);
        }
        for (const [w, count] of dbCounts.entries()) {
          sbtsCountByWallet.set(w, Math.max(sbtsCountByWallet.get(w) || 0, count));
        }
      }
    } catch {
      // Fallback gracefully when DB client isn't connected
    }
  }

  if (enableSqlOverlay && params.prisma?.profileRecord) {
    try {
      const dbProfiles = await params.prisma.profileRecord.findMany({
        where: { reputationPoints: { gt: 0 } },
        select: {
          address: true,
          primaryCategoryId: true,
          reputationPoints: true,
          completedJobsCount: true,
        },
      });
      if (Array.isArray(dbProfiles)) {
        for (const row of dbProfiles) {
          const w = String(row.address || '').toLowerCase().trim();
          if (!w) continue;
          explicitPointsByWallet.set(
            w,
            Math.max(explicitPointsByWallet.get(w) || 0, Number(row.reputationPoints) || 0)
          );
          completedCountByWallet.set(
            w,
            Math.max(completedCountByWallet.get(w) || 0, Number(row.completedJobsCount) || 0)
          );
          if (row.primaryCategoryId) {
            const list = completedCatsByWallet.get(w) || [];
            list.unshift(row.primaryCategoryId);
            completedCatsByWallet.set(w, list);
          }
        }
      }
    } catch {
      // Fallback gracefully in memory-only mode
    }
  }

  const candidateWallets = new Set<string>([
    ...Object.keys(profiles).map((k) => k.toLowerCase().trim()),
    ...completedCountByWallet.keys(),
    ...sbtsCountByWallet.keys(),
    ...explicitPointsByWallet.keys(),
  ]);

  const rawEntries: Omit<LeaderboardEntry, 'rank' | 'percentile'>[] = [];
  for (const wallet of candidateWallets) {
    if (!/^0x[a-f0-9]{40}$/.test(wallet)) continue;
    const profile = profiles[wallet] || {};

    const completedJobs = Math.max(
      completedCountByWallet.get(wallet) || 0,
      Number(profile.completedJobsCount || profile.completed_jobs_count) || 0
    );
    const verifiedSbts = Math.max(
      sbtsCountByWallet.get(wallet) || 0,
      Number(profile.verifiedSbtsCount) || 0
    );
    const contractPts = Math.max(
      explicitPointsByWallet.get(wallet) || 0,
      Number(profile.onchainReputationPoints || profile.reputationPoints || profile.reputation_points) || 0
    );

    const derivedPts = completedJobs * 100 + verifiedSbts * 50;
    const realReputationPoints = Math.max(contractPts, derivedPts);

    // Strictly exclude zero-activity wallets ("only where data exists")
    if (realReputationPoints <= 0) continue;

    const catInfo = resolveProfileCategory(profile, completedCatsByWallet.get(wallet) || []);
    const displayName =
      String(profile.displayName || profile.name || '').trim() ||
      `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

    rawEntries.push({
      address: wallet,
      display_name: displayName,
      category_id: catInfo.id,
      category_slug: catInfo.slug,
      category_name: catInfo.name,
      reputation_points: realReputationPoints,
      completed_jobs_count: completedJobs,
      verified_sbts_count: verifiedSbts,
      tier: getReputationTier(realReputationPoints),
    });
  }

  // Deterministic ordering matching SQL index: (reputation_points DESC, completed_jobs_count DESC, address ASC)
  rawEntries.sort(
    (a, b) =>
      b.reputation_points - a.reputation_points ||
      b.completed_jobs_count - a.completed_jobs_count ||
      a.address.localeCompare(b.address)
  );

  const total = rawEntries.length;
  const entries: LeaderboardEntry[] = rawEntries.map((row, idx) => {
    const rank = idx + 1;
    return {
      ...row,
      rank,
      percentile: calculateReputationPercentile(rank, total),
    };
  });

  leaderboardCache = {
    entries,
    builtAt: now,
    expiresAt: now + LEADERBOARD_CACHE_TTL_MS,
  };

  const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
  return {
    entries,
    cached: false,
    queryMs: Number(elapsedMs.toFixed(3)),
  };
}

export function queryLeaderboardPage(params: {
  entries: LeaderboardEntry[];
  category?: string;
  cursor?: string;
  limit?: number;
  viewerAddress?: string | null;
}): {
  items: LeaderboardEntry[];
  nextCursor: string | null;
  total: number;
  myRank: MyRankSummary | null;
} {
  const cleanCat = (params.category || '').trim();
  let scoped = params.entries;

  if (cleanCat && cleanCat.toLowerCase() !== 'all') {
    const targetCat =
      findTaxonomyCategory(cleanCat) ||
      (LEGACY_CATEGORY_MAP[cleanCat.toLowerCase()]
        ? findTaxonomyCategory(LEGACY_CATEGORY_MAP[cleanCat.toLowerCase()].categoryId)
        : undefined);

    if (!targetCat) {
      scoped = [];
    } else {
      scoped = params.entries
        .filter((e) => e.category_id === targetCat.id)
        .map((e, idx, arr) => ({
          ...e,
          rank: idx + 1,
          percentile: calculateReputationPercentile(idx + 1, arr.length),
        }));
    }
  }

  const limit = Math.min(Math.max(1, Number(params.limit) || 20), 100);
  let startIdx = 0;
  if (params.cursor) {
    const cursorClean = params.cursor.toLowerCase().trim();
    const idx = scoped.findIndex((e) => e.address === cursorClean);
    if (idx !== -1) startIdx = idx + 1;
  }

  const items = scoped.slice(startIdx, startIdx + limit);
  const nextCursor =
    items.length === limit && startIdx + limit < scoped.length
      ? items[items.length - 1].address
      : null;

  let myRank: MyRankSummary | null = null;
  const cleanViewer = (params.viewerAddress || '').toLowerCase().trim();
  if (cleanViewer && /^0x[a-f0-9]{40}$/.test(cleanViewer)) {
    const found = scoped.find((e) => e.address === cleanViewer);
    if (found) {
      myRank = {
        address: cleanViewer,
        rank: found.rank,
        totalParticipants: scoped.length,
        inLeaderboard: true,
        reputation_points: found.reputation_points,
        completed_jobs_count: found.completed_jobs_count,
        verified_sbts_count: found.verified_sbts_count,
        category_id: found.category_id,
        percentile: found.percentile,
      };
    } else {
      myRank = {
        address: cleanViewer,
        rank: null,
        totalParticipants: scoped.length,
        inLeaderboard: false,
        reputation_points: 0,
        completed_jobs_count: 0,
        verified_sbts_count: 0,
        category_id: null,
        percentile: 'Unranked',
      };
    }
  }

  return {
    items,
    nextCursor,
    total: scoped.length,
    myRank,
  };
}

export function buildTopByCategoryGroups(params: {
  entries: LeaderboardEntry[];
  limitPerCategory?: number;
}): TopByCategoryGroup[] {
  const cap = Math.min(Math.max(1, Number(params.limitPerCategory) || 3), 10);
  const groups: TopByCategoryGroup[] = [];

  for (const cat of TAXONOMY_CATEGORIES) {
    const matching = params.entries.filter((e) => e.category_id === cat.id);
    if (matching.length === 0) continue; // Only return categories where real data exists

    const top = matching.slice(0, cap).map((e, idx) => ({
      ...e,
      rank: idx + 1,
      percentile: calculateReputationPercentile(idx + 1, matching.length),
    }));

    groups.push({
      category_id: cat.id,
      category_slug: cat.slug,
      category_name: cat.name,
      track: cat.track,
      total_ranked: matching.length,
      top,
    });
  }

  return groups;
}
