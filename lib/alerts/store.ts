import crypto from "crypto";

export interface AuditXAlertPayload {
  contractAddress: string;
  severity: "INFO" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  description: string;
  txHash?: string;
  detectedAt: string;
}

export interface StoredAlert extends AuditXAlertPayload {
  id: string;
  receivedAt: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
}

// Memory store backed by content-hash Map for fast lookup & deduplication
const alertStore = new Map<string, StoredAlert>();

export async function storeAlert(payload: AuditXAlertPayload): Promise<string | null> {
  const contentHash = crypto
    .createHash("sha256")
    .update(`${payload.contractAddress}:${payload.category}:${payload.detectedAt}`)
    .digest("hex");

  if (alertStore.has(contentHash)) {
    return null; // duplicate, don't re-store or re-notify
  }

  const alert: StoredAlert = {
    id: contentHash,
    ...payload,
    receivedAt: new Date().toISOString(),
    acknowledged: false,
    acknowledgedBy: null,
  };

  alertStore.set(contentHash, alert);
  return alert.id;
}

export async function getAlertsForJob(contractAddress: string): Promise<StoredAlert[]> {
  const results: StoredAlert[] = [];
  for (const alert of alertStore.values()) {
    if (alert.contractAddress.toLowerCase() === contractAddress.toLowerCase()) {
      results.push(alert);
    }
  }
  return results;
}

export async function getAllAlerts(): Promise<StoredAlert[]> {
  return Array.from(alertStore.values());
}

export async function acknowledgeAlert(alertId: string, adminAddress: string): Promise<boolean> {
  const alert = alertStore.get(alertId);
  if (!alert) return false;
  alert.acknowledged = true;
  alert.acknowledgedBy = adminAddress;
  return true;
}

export function clearAlertStore() {
  alertStore.clear();
}
