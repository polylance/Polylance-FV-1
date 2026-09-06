import { getJobEvents } from "./eventIndexer";

export async function getJobTimeline(jobAddress: string) {
  const events = await getJobEvents(jobAddress); // direct, not cached platform-wide —
                                                   // job detail pages want freshest data
  return events
    .sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : 1))
    .map((e) => ({
      step: e.eventName,
      timestamp: e.timestamp,
      txHash: e.txHash,
      polygonscanUrl: `https://amoy.polygonscan.com/tx/${e.txHash}`,
      details: JSON.parse(
        JSON.stringify(e.args, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      ),
    }));
}
