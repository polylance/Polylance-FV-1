import { getAllPlatformEvents } from "./aggregate";

export async function getAdminStats() {
  const events = await getAllPlatformEvents();

  const fees = events
    .filter((e) => e.eventName === "PaymentReleased")
    .reduce((sum, e) => sum + BigInt((e.args.fee as bigint) ?? 0n), 0n);

  const judgeRulings = events.filter((e) => e.eventName === "DisputeResolved");
  const rulingsByJudge = judgeRulings.reduce((acc, e) => {
    const judge = e.args.judge as string;
    if (judge) {
      acc[judge] = (acc[judge] ?? 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return { totalFeesCollected: fees.toString(), rulingsByJudge };
}
