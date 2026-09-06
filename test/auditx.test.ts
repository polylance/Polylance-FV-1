import { expect } from "chai";
import crypto from "crypto";
import { validateAuditXConfig } from "../lib/config/validateEnv";
import { registerJobForMonitoring } from "../lib/auditx/client";
import { POST as webhookHandler } from "../app/api/webhooks/auditx-alert/route";
import { clearAlertStore } from "../lib/alerts/store";

describe("AuditX Security Monitoring & Webhook Integration", function () {
  const TEST_SECRET = "sec_bc2d1ed617a54e36980b6381051a38c7";
  const TEST_API_KEY = "ax_live_af4eb3795d5140878278cc82d01c3a6d";

  let originalEnv: NodeJS.ProcessEnv;

  before(function () {
    originalEnv = { ...process.env };
  });

  afterEach(function () {
    process.env = { ...originalEnv };
    clearAlertStore();
  });

  describe("Boot-Time Config Validation (lib/config/validateEnv.ts)", function () {
    it("should throw a loud error if required AuditX env vars are missing", function () {
      delete process.env.AUDITX_API_URL;
      delete process.env.AUDITX_API_KEY;
      delete process.env.AUDITX_WEBHOOK_SECRET;

      expect(() => validateAuditXConfig()).to.throw("AuditX monitoring misconfigured — missing:");
    });

    it("should pass validation when all required AuditX env vars are present", function () {
      process.env.AUDITX_API_URL = "https://auditx.yourapp.com";
      process.env.AUDITX_API_KEY = TEST_API_KEY;
      process.env.AUDITX_WEBHOOK_SECRET = TEST_SECRET;

      expect(() => validateAuditXConfig()).to.not.throw();
    });
  });

  describe("Monitoring Registration Client (lib/auditx/client.ts)", function () {
    it("should return false gracefully if API credentials are missing", async function () {
      delete process.env.AUDITX_API_URL;
      delete process.env.AUDITX_API_KEY;

      const registered = await registerJobForMonitoring("0x0000000000000000000000000000000000dEaD");
      expect(registered).to.be.false;
    });

    it("should return false on network failure without throwing unhandled exceptions", async function () {
      process.env.AUDITX_API_URL = "http://invalid-auditx-domain-12345.local";
      process.env.AUDITX_API_KEY = TEST_API_KEY;

      const registered = await registerJobForMonitoring("0x0000000000000000000000000000000000dEaD");
      expect(registered).to.be.false;
    });
  });

  describe("Webhook Signature Verification & Deduplication (app/api/webhooks/auditx-alert/route.ts)", function () {
    const samplePayload = {
      contractAddress: "0x1234567890123456789012345678901234567890",
      severity: "HIGH",
      category: "REENTRANCY",
      description: "Potential reentrancy attempt detected on escrow release",
      detectedAt: "2026-07-25T12:00:00Z",
    };

    function computeSignature(body: string, secret: string): string {
      return crypto.createHmac("sha256", secret).update(body).digest("hex");
    }

    beforeEach(function () {
      process.env.AUDITX_WEBHOOK_SECRET = TEST_SECRET;
    });

    it("should accept valid HMAC-SHA256 signature and process alert", async function () {
      const rawBody = JSON.stringify(samplePayload);
      const signature = computeSignature(rawBody, TEST_SECRET);

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

    it("should reject invalid webhook signatures with status 401", async function () {
      const rawBody = JSON.stringify(samplePayload);
      const invalidSignature = "deadbeef1234567890";

      const req = new Request("http://localhost:3000/api/webhooks/auditx-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auditx-signature": invalidSignature,
        },
        body: rawBody,
      });

      const res = await webhookHandler(req);
      expect(res.status).to.equal(401);

      const json = await res.json();
      expect(json.error).to.equal("Invalid signature");
    });

    it("should handle duplicate webhook payloads idempotently", async function () {
      const rawBody = JSON.stringify({
        ...samplePayload,
        alertId: "alert-unique-dedupe-123",
      });
      const signature = computeSignature(rawBody, TEST_SECRET);

      // First submission
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

      // Duplicate submission
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
});
