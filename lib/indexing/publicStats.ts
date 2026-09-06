import { getAllPlatformEvents } from "./aggregate";

export async function getPublicStats() {
  const events = await getAllPlatformEvents();
  const jobAddresses = [...new Set(events.map((e) => e.jobAddress))];

  const funded = events.filter((e) => e.eventName === "JobFunded");
  const totalValueLocked = funded.reduce(
    (sum, e) => sum + BigInt((e.args.amount as bigint) ?? 0n),
    0n
  );

  const completedJobAddresses = [
    ...new Set(
      events
        .filter(
          (e) =>
            e.eventName === "PaymentReleased" ||
            e.eventName === "AutoReleased" ||
            e.eventName === "DisputeResolved"
        )
        .map((e) => e.jobAddress)
    ),
  ];

  const disputesRaised = events.filter((e) => e.eventName === "DisputeRaised").length;
  const disputesResolved = events.filter((e) => e.eventName === "DisputeResolved");

  const avgResolutionTime =
    disputesResolved.length > 0
      ? disputesResolved.reduce((sum, resolved) => {
          const raised = events.find(
            (e) => e.eventName === "DisputeRaised" && e.jobAddress === resolved.jobAddress
          );
          return sum + (raised ? resolved.timestamp - raised.timestamp : 0);
        }, 0) / disputesResolved.length
      : null; // null, not 0 — no fake "0 days" when there's no data yet

  return {
    totalJobsPosted: jobAddresses.length,
    totalValueLocked: totalValueLocked.toString(),
    jobsCompleted: completedJobAddresses.length,
    disputeRate: jobAddresses.length > 0 ? disputesRaised / jobAddresses.length : null,
    avgDisputeResolutionSeconds: avgResolutionTime,
  };
}
