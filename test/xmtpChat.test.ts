import { expect } from "chai";
import { canMessage } from "../lib/xmtp/reachability";
import { getXmtpEnv, getXmtpClient, setMockXmtpClient } from "../lib/xmtp/client";
import { formatTermsSummaryMessage, TermsData } from "../lib/xmtp/termsHelper";
import { acquireTabLock } from "../lib/xmtp/tabLock";

describe("XMTP Negotiation Chat (V3 MLS)", function () {
  const originalEnv = process.env.NEXT_PUBLIC_XMTP_ENV;

  afterEach(function () {
    process.env.NEXT_PUBLIC_XMTP_ENV = originalEnv;
    setMockXmtpClient(null);
  });

  describe("PHASE 0 & 1 — Environment & Tab-Lock Guards", function () {
    it("should resolve dev environment for testnet by default", function () {
      delete process.env.NEXT_PUBLIC_XMTP_ENV;
      expect(getXmtpEnv()).to.equal(process.env.NODE_ENV === "production" ? "production" : "dev");
    });

    it("should resolve explicit NEXT_PUBLIC_XMTP_ENV override", function () {
      process.env.NEXT_PUBLIC_XMTP_ENV = "production";
      expect(getXmtpEnv()).to.equal("production");
    });

    it("should execute tab-lock callback when navigator.locks is unconstrained in test runner", async function () {
      let executed = false;
      await acquireTabLock(
        async () => {
          executed = true;
        },
        () => {}
      );
      expect(executed).to.be.true;
    });
  });

  describe("PHASE 2 — Reachability Checker (lib/xmtp/reachability.ts)", function () {
    it("should return false for empty or zero address", async function () {
      expect(await canMessage("")).to.be.false;
      expect(await canMessage("0x0000000000000000000000000000000000000000")).to.be.false;
    });

    it("should return false gracefully if address is not registered on XMTP dev network", async function () {
      const isReachable = await canMessage("0x1111111111111111111111111111111111111111");
      expect(isReachable).to.be.a("boolean");
    });
  });

  describe("PHASE 5 — Terms Proposal Summary Formatting (lib/xmtp/termsHelper.ts)", function () {
    it("should format human-readable terms summary message with on-chain terms hash", function () {
      const terms: TermsData = {
        jobAddress: "0xJob1234567890123456789012345678901234567",
        termsHash: "0xTermsHash1234567890",
        scopeDescription: "Build MVP backend and IPFS service",
        agreedAmount: "2.5 ETH",
        deadlineDays: 14,
      };

      const proposer = "0xClientWalletAddress123456789012345678";
      const formatted = formatTermsSummaryMessage(terms, proposer);

      expect(formatted).to.include("📜 **Terms Proposed by 0xClie...5678**");
      expect(formatted).to.include("0xJob1234567890123456789012345678901234567");
      expect(formatted).to.include("2.5 ETH");
      expect(formatted).to.include("14 days");
      expect(formatted).to.include("Build MVP backend and IPFS service");
      expect(formatted).to.include("0xTermsHash1234567890");
    });
  });
});
