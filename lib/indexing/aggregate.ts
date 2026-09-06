import { getAllJobAddresses, getJobEvents, JobEventRecord } from "./eventIndexer";

let cache: { data: JobEventRecord[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute — analytics doesn't need sub-second freshness

export async function getAllPlatformEvents(): Promise<JobEventRecord[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const addresses = await getAllJobAddresses();
  const CONCURRENCY = 15;
  const allEvents: JobEventRecord[] = [];

  for (let i = 0; i < addresses.length; i += CONCURRENCY) {
    const batch = addresses.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((addr) => getJobEvents(addr)));
    allEvents.push(...results.flat());
  }

  cache = { data: allEvents, fetchedAt: Date.now() };
  return allEvents;
}

// Force-refresh — call this from the JobFactory.JobDeployed listener
// so a brand-new job shows up without waiting for cache expiry
export function invalidateCache() {
  cache = null;
}
