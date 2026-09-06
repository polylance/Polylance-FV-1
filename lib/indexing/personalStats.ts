import { getAllPlatformEvents } from "./aggregate";

export async function getPersonalStats(userAddress: string) {
  const events = await getAllPlatformEvents();

  const myApplications = events.filter(
    (e) =>
      e.eventName === "ApplicationSubmitted" &&
      (e.args.applicant as string)?.toLowerCase() === userAddress.toLowerCase()
  );
  const mySelections = events.filter(
    (e) =>
      e.eventName === "FreelancerSelected" &&
      (e.args.freelancer as string)?.toLowerCase() === userAddress.toLowerCase()
  );
  const myCompletedJobs = mySelections.filter((sel) =>
    events.some(
      (e) =>
        e.jobAddress.toLowerCase() === sel.jobAddress.toLowerCase() &&
        (e.eventName === "PaymentReleased" || e.eventName === "AutoReleased")
    )
  );

  const totalEarned = myCompletedJobs.reduce((sum, job) => {
    const payout = events.find(
      (e) => e.jobAddress.toLowerCase() === job.jobAddress.toLowerCase() && e.eventName === "PaymentReleased"
    );
    return sum + (payout ? BigInt((payout.args.toFreelancer as bigint) ?? 0n) : 0n);
  }, 0n);

  return {
    applicationsSent: myApplications.length,
    jobsCompleted: myCompletedJobs.length,
    successRate: myApplications.length > 0 ? myCompletedJobs.length / myApplications.length : null,
    totalEarned: totalEarned.toString(),
  };
}
