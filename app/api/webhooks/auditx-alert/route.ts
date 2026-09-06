import { verifyAuditXSignature } from "../../../../lib/auditx/verifyWebhook";
import { storeAlert, AuditXAlertPayload } from "../../../../lib/alerts/store";
import { notifyAdmins } from "../../../../lib/notifications";
import { checkWebhookRateLimit, checkFailedWebhookAuthLimit } from "../../../../lib/ratelimit/webhookLimiter";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limit 1: overall webhook traffic volume ceiling per IP (100 req / 1 min)
  const volumeRes = await checkWebhookRateLimit(ip);
  if (!volumeRes.success) {
    console.log(JSON.stringify({ event: "rate_limited", route: "/api/webhooks/auditx-alert", identifier: ip, type: "webhook_volume" }));
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-auditx-signature");

  if (!verifyAuditXSignature(rawBody, signature)) {
    // Rate limit 2: strict throttling on failed signature authentication (5 failed attempts / 1 min)
    const { success: stillAllowed } = await checkFailedWebhookAuthLimit(ip);
    if (!stillAllowed) {
      console.error(`SECURITY: repeated failed webhook auth from ${ip} — possible brute-force attempt`);
      console.log(JSON.stringify({ event: "security_brute_force_throttled", route: "/api/webhooks/auditx-alert", identifier: ip }));
    } else {
      console.warn("Rejected webhook: invalid signature", { ip });
    }
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: AuditXAlertPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.contractAddress || !payload.severity || !payload.description) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Idempotency: AuditX retry logic deduplicated via content hash
  const alertId = await storeAlert(payload);
  if (alertId === null) {
    return Response.json({ status: "duplicate, already recorded" }, { status: 200 });
  }

  if (payload.severity === "CRITICAL" || payload.severity === "HIGH") {
    await notifyAdmins({
      title: `${payload.severity} alert on job ${payload.contractAddress.slice(0, 8)}...`,
      body: payload.description,
      contractAddress: payload.contractAddress,
    });
  }

  return Response.json({ status: "received", alertId }, { status: 200 });
}
