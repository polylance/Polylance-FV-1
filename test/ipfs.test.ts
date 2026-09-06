import { expect } from "chai";
import { ethers } from "hardhat";
import { uploadFile, uploadJSON, uploadMultiple } from "../lib/ipfs/upload";
import { verifyWalletAuth, AUTH_CHALLENGE_MESSAGE } from "../lib/auth";
import { fetchAndVerify } from "../lib/ipfs/verify";

describe("IPFS Upload Service & Filebase Integration", function () {
  let wallet: any;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    wallet = signers[0];
  });

  describe("Validation & Upload Helpers (lib/ipfs/upload.ts)", function () {
    it("should reject files exceeding 25MB limit", async function () {
      // Create a mock large file object (>25MB)
      const largeFile = {
        name: "huge.pdf",
        size: 26 * 1024 * 1024, // 26MB
        type: "application/pdf",
      } as unknown as File;

      await expect(uploadFile(largeFile)).to.be.rejectedWith("File exceeds 25MB limit");
    });

    it("should reject unsupported file types", async function () {
      const invalidFile = {
        name: "malicious.exe",
        size: 1024,
        type: "application/x-msdownload",
      } as unknown as File;

      await expect(uploadFile(invalidFile)).to.be.rejectedWith("File type application/x-msdownload not allowed");
    });

    it("should accept valid file types (pdf, png, jpeg, webp, txt)", async function () {
      const validTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain"];
      for (const type of validTypes) {
        const mockFile = new File(["dummy content"], `sample.${type.split("/")[1]}`, { type });

        try {
          await uploadFile(mockFile);
        } catch (err: any) {
          // Verify that client-side validation passed (error is from API call, not validation)
          expect(err.message).to.not.include("limit");
          expect(err.message).to.not.include("not allowed");
        }
      }
    });
  });

  describe("Wallet Auth Verification (lib/auth.ts)", function () {
    it("should verify valid signed authentication headers", async function () {
      const address = await wallet.getAddress();
      const signature = await wallet.signMessage(AUTH_CHALLENGE_MESSAGE);

      const req = new Request("http://localhost:3000/api/ipfs/upload", {
        method: "POST",
        headers: {
          "x-wallet-address": address,
          "x-wallet-signature": signature,
        },
      });

      const isValid = await verifyWalletAuth(req);
      expect(isValid).to.be.true;
    });

    it("should verify valid Bearer authorization header", async function () {
      const address = await wallet.getAddress();
      const signature = await wallet.signMessage(AUTH_CHALLENGE_MESSAGE);

      const req = new Request("http://localhost:3000/api/ipfs/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${signature}:${address}`,
        },
      });

      const isValid = await verifyWalletAuth(req);
      expect(isValid).to.be.true;
    });

    it("should reject invalid signature or missing headers", async function () {
      const address = await wallet.getAddress();
      const invalidSignature = "0x" + "00".repeat(65);

      const reqInvalidSig = new Request("http://localhost:3000/api/ipfs/upload", {
        method: "POST",
        headers: {
          "x-wallet-address": address,
          "x-wallet-signature": invalidSignature,
        },
      });

      expect(await verifyWalletAuth(reqInvalidSig)).to.be.false;

      const reqMissingHeaders = new Request("http://localhost:3000/api/ipfs/upload", {
        method: "POST",
      });

      expect(await verifyWalletAuth(reqMissingHeaders)).to.be.false;
    });
  });

  describe("Content Verification Helper (lib/ipfs/verify.ts)", function () {
    it("should construct proper gateway URL for fetching and return parsed content", async function () {
      const originalFetch = global.fetch;
      let fetchedUrl = "";
      global.fetch = (async (url: string | URL | Request) => {
        fetchedUrl = url.toString();
        return new Response(JSON.stringify({ test: "data" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as any;

      try {
        const result = await fetchAndVerify("QmTestHash123456789");
        expect(fetchedUrl).to.include("QmTestHash123456789");
        expect(fetchedUrl).to.include("ipfs.filebase.io");
        expect(result).to.deep.equal({ test: "data" });
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
