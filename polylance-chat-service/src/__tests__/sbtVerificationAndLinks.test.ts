import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import { sbtRouter } from "../sbtRoutes.js";

describe("Checks H.28 & H.29: SBT Metadata, Polygonscan Links, and Dual-Role Aggregation", () => {
  let app: express.Express;
  let server: http.Server;
  let port: number;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api/sbt", sbtRouter);

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(3030, () => {
        port = 3030;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe("Check H.28: SBT Metadata and Canonical Polygonscan Links", () => {
    it("returns valid ERC-721 metadata with PL-SBT # display name and secondary certificate number", async () => {
      const res = await fetch(`${baseUrl}/api/sbt/metadata/2`);
      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");

      const json = await res.json();
      expect(json.name).toBe("PolyLance Certificate of Patronage PL-SBT #2");
      expect(json.description).toContain("Certificate No: #9805");
      expect(json.image).toContain("/api/sbt/image/2.svg");
      expect(json.external_url).toContain("token=2&cert=9805");

      // Attributes check
      const attrs = json.attributes;
      expect(attrs).toBeInstanceOf(Array);
      const displayIdAttr = attrs.find((a: any) => a.trait_type === "Display ID");
      expect(displayIdAttr?.value).toBe("PL-SBT #2");

      const secondaryIdAttr = attrs.find((a: any) => a.trait_type === "Secondary ID");
      expect(secondaryIdAttr?.value).toBe("Certificate No: #9805");

      const contractAttr = attrs.find((a: any) => a.trait_type === "Contract");
      expect(contractAttr?.value).toBe("0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879");

      const soulboundAttr = attrs.find((a: any) => a.trait_type === "Soulbound");
      expect(soulboundAttr?.value).toBe("True");
    });

    it("verifies canonical Polygonscan NFT link format", async () => {
      const res = await fetch(`${baseUrl}/api/sbt/verify/2`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.verified).toBe(true);
      expect(json.displayId).toBe("PL-SBT #2");
      expect(json.secondaryId).toBe("Certificate No: #9805");
      expect(json.polygonscanNftUrl).toBe(
        "https://polygonscan.com/nft/0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879/2"
      );
    });
  });

  describe("Check H.29: Dual-Role Certificate Aggregation", () => {
    it("aggregates certificates across both Patronage and Verified Work roles for wallet 0xB8aa...", async () => {
      // 0xB8aa0398B91A150B041DA819bc954Bb356e009Dd is holder of Token 2 (Patronage)
      // and client on Token 0 (Work)
      const res = await fetch(`${baseUrl}/api/sbt/user/0xB8aa0398B91A150B041DA819bc954Bb356e009Dd`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.address).toBe("0xb8aa0398b91a150b041da819bc954bb356e009dd");
      expect(json.tokens).toBeInstanceOf(Array);
      expect(json.tokens.length).toBeGreaterThanOrEqual(2);

      const variants = json.tokens.map((t: any) => t.variant);
      expect(variants).toContain("patronage");
      expect(variants).toContain("work");

      const token2 = json.tokens.find((t: any) => t.onchainTokenId === 2);
      expect(token2.displayId).toBe("PL-SBT #2");
      expect(token2.secondaryId).toBe("Certificate No: #9805");
      expect(token2.polygonscanNftUrl).toBe(
        "https://polygonscan.com/nft/0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879/2"
      );
    });
  });
});
