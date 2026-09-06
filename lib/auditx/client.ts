// lib/auditx/client.ts

export async function registerJobForMonitoring(jobContractAddress: string): Promise<boolean> {
  const AUDITX_API = process.env.AUDITX_API_URL;
  const AUDITX_API_KEY = process.env.AUDITX_API_KEY;

  if (!AUDITX_API || !AUDITX_API_KEY) {
    console.error(`AuditX registration failed for ${jobContractAddress}: AUDITX_API_URL or AUDITX_API_KEY missing`);
    return false;
  }

  try {
    const res = await fetch(`${AUDITX_API}/api/monitor/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUDITX_API_KEY}`,
      },
      body: JSON.stringify({
        address: jobContractAddress,
        chain: "polygon-amoy",
        watchFor: ["reentrancy", "scam-flagged-counterparty", "anomalous-value-flow"],
      }),
    });

    if (!res.ok) {
      console.error(`AuditX registration failed for ${jobContractAddress}:`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`AuditX registration request failed:`, err);
    return false; // network failure — log and proceed, don't block job posting
  }
}
