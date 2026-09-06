import { expect } from "chai";
import crypto from "crypto";
import { verifyAuditXSignature } from "../lib/auditx/verifyWebhook";
import { storeAlert, getAlertsForJob, acknowledgeAlert, clearAlertStore } from "../lib/alerts/store";
import { POST as webhookHandler } from "../app/api/webhooks/auditx-alert/route";

describe("AuditX Alert Webhook Receiver (Phase 1 to Phase 6)", function () {
  const SECRET = "sec_bc2d1ed617a54e36980b6381051a38c7";

  let originalSecret: string | undefined;

  before(function () {
    originalSecret = process.env.AUDITX_WEBHOOK_SECRET;
  });

  beforeEach(function () {
    process.env.AUDITX_WEBHOOK_SECRET = SECRET;
    clearAlertStore();
  });

  after(function () {
    process.env.AUDITX_WEBHOOK_SECRET = originalSecret;
  });

  function computeHmac(body: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }

  describe("PHASE 1 — HMAC Verification (lib/auditx/verifyWebhook.ts)", function () {
    it("should return true for valid HMAC signature", function () {
      const body = '{"test":true}';
      const sig = computeHmac(body, SECRET);
      expect(verifyAuditXSignature(body, sig)).to.be.true;
    });

    it("should return false for invalid HMAC signature or missing header", function () {
      const body = '{"test":true}';
      expect(verifyAuditXSignature(body, "invalid_signature")).to.be.false;
      expect(verifyAuditXSignature(body, null)).to.be.false;
    });
  });

  describe("PHASE 2 & 3 — Webhook Handler & Content-Hash Deduplication", function () {
    const validPayload = {
      contractAddress: "0x9876543210987654321098765432109876543210",
      severity: "CRITICAL",
      category: "REENTRANCY",
      description: "Reentrancy vulnerability triggered on claimAutoRelease",
      detectedAt: "2026-07-25T15:00:00Z",
    };

    it("should process valid payload and return 200 with received status", async function () {
      const rawBody = JSON.stringify(validPayload);
      const signature = computeHmac(rawBody, SECRET);

      const req = new Request("http://localhost:3000/api/webhooks/auditx-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auditx-signature": signature,
        },
        body: rawBody,
      });

      const res = await webhookHandler(req);
      expect(res.status).to.equal(200);

      const json = await res.json();
      expect(json.status).to.equal("received");
      expect(json.alertId).to.be.a("string");
    });

    it("should return 401 on signature mismatch", async function () {
      const rawBody = JSON.stringify(validPayload);

      const req = new Request("http://localhost:3000/api/webhooks/auditx-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auditx-signature": "wrong_signature_hash",
        },
        body: rawBody,
      });

      const res = await webhookHandler(req);
      expect(res.status).to.equal(401);
      expect((await res.json()).error).to.equal("Invalid signature");
    });

    it("should return 400 on malformed JSON payload", async function () {
      const rawBody = "{ malformed json ";
      const signature = computeHmac(rawBody, SECRET);

      const req = new Request("http://localhost:3000/api/webhooks/auditx-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auditx-signature": signature,
        },
        body: rawBody,
      });

      const res = await webhookHandler(req);
      expect(res.status).to.equal(400);
      expect((await res.json()).error).to.equal("Invalid JSON");
    });

    it("should return 400 on missing required fields", async function () {
      const rawBody = JSON.stringify({ category: "REENTRANCY" }); // missing contractAddress, severity, description
      const signature = computeHmac(rawBody, SECRET);

      const req = new Request("http://localhost:3000/api/webhooks/auditx-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auditx-signature": signature,
        },
        body: rawBody,
      });

      const res = await webhookHandler(req);
      expect(res.status).to.equal(400);
      expect((await res.json()).error).to.equal("Missing required fields");
    });

    it("should deduplicate identical alerts and return status duplicate, already recorded", async function () {
      const rawBody = JSON.stringify(validPayload);
      const signature = computeHmac(rawBody, SECRET);

      const req1 = new Request("http://localhost:3000/api/webhooks/auditx-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auditx-signature": signature,
        },
        body: rawBody,
      });
      const res1 = await webhookHandler(req1);
      expect(res1.status).to.equal(200);
      expect((await res1.json()).status).to.equal("received");

      // Second identical request
      const req2 = new Request("http://localhost:3000/api/webhooks/auditx-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auditx-signature": signature,
        },
        body: rawBody,
      });
      const res2 = await webhookHandler(req2);
      expect(res2.status).to.equal(200);
      expect((await res2.json()).status).to.equal("duplicate, already recorded");
    });
  });

  describe("PHASE 3 & 5 — Alert Storage, Queries & Acknowledgment", function () {
    const jobAddr = "0xAAA0000000000000000000000000000000000111";

    it("should store, query by job address, and acknowledge alerts", async function () {
      const alertId = await storeAlert({
        contractAddress: jobAddr,
        severity: "HIGH",
        category: "ANOMALOUS_VALUE",
        description: "Unusual payout transfer detected",
        detectedAt: "2026-07-25T16:00:00Z",
      });

      expect(alertId).to.be.a("string");

      const jobAlerts = await getAlertsForJob(jobAddr);
      expect(jobAlerts.length).to.equal(1);
      expect(jobAlerts[0].acknowledged).to.be.false;

      // Admin acknowledges alert
      const adminWallet = "0xAdminWallet123456789";
      const ackSuccess = await acknowledgeAlert(alertId!, adminWallet);
      expect(ackSuccess).to.be.true;

      const updatedAlerts = await getAlertsForJob(jobAddr);
      expect(updatedAlerts[0].acknowledged).to.be.true;
      expect(updatedAlerts[0].acknowledgedBy).to.equal(adminWallet);
    });
  });
});
