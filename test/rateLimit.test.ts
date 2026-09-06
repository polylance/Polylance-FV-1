import { expect } from "chai";
import { checkUploadRateLimit, checkUploadVolumeLimit } from "../lib/ratelimit/uploadLimiter";
import { checkWebhookRateLimit, checkFailedWebhookAuthLimit } from "../lib/ratelimit/webhookLimiter";

describe("Rate Limiting Service — Per-Wallet Upload & Webhook Security", function () {
  const testWallet = "0x1111111111111111111111111111111111111111";
  const testIp = "192.168.1.100";

  describe("IPFS Upload Per-Wallet Limiting", function () {
    it("allows up to 10 upload requests per window and blocks the 11th", async function () {
      const wallet = `${testWallet}-count`;
      for (let i = 0; i < 10; i++) {
        const res = await checkUploadRateLimit(wallet);
        expect(res.success).to.be.true;
      }
      const blockedRes = await checkUploadRateLimit(wallet);
      expect(blockedRes.success).to.be.false;
      expect(blockedRes.remaining).to.equal(0);
    });

    it("blocks uploads exceeding 100MB volume window limit", async function () {
      const wallet = `${testWallet}-volume`;
      const fiftyMB = 50 * 1024 * 1024;

      const res1 = await checkUploadVolumeLimit(wallet, fiftyMB);
      expect(res1.success).to.be.true;

      const res2 = await checkUploadVolumeLimit(wallet, fiftyMB);
      expect(res2.success).to.be.true;

      // 3rd 50MB upload exceeds 100MB window
      const res3 = await checkUploadVolumeLimit(wallet, fiftyMB);
      expect(res3.success).to.be.false;
    });
  });

  describe("AuditX Webhook Per-Source & Failed Auth Throttling", function () {
    it("allows up to 100 webhook calls per IP window", async function () {
      const ip = `${testIp}-vol`;
      for (let i = 0; i < 100; i++) {
        const res = await checkWebhookRateLimit(ip);
        expect(res.success).to.be.true;
      }
      const blockedRes = await checkWebhookRateLimit(ip);
      expect(blockedRes.success).to.be.false;
    });

    it("stricter 5-attempt limit on failed webhook signature auth", async function () {
      const ip = `${testIp}-fail`;
      for (let i = 0; i < 5; i++) {
        const res = await checkFailedWebhookAuthLimit(ip);
        expect(res.success).to.be.true;
      }
      const blockedRes = await checkFailedWebhookAuthLimit(ip);
      expect(blockedRes.success).to.be.false;
    });
  });
});
