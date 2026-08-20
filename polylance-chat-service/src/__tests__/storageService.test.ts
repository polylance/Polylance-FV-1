import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "../services/storage/storage.service.js";

// Mock FilebaseIpfsService
vi.mock("../services/storage/filebase-ipfs.service.js", () => {
  return {
    FilebaseIpfsService: vi.fn().mockImplementation(() => {
      return {
        uploadFile: vi.fn().mockImplementation(async (buffer, fileName, mimeType, key) => {
          if (fileName === "trigger-error.txt") {
            throw new Error("Filebase network timeout");
          }
          if (fileName === "missing-cid.txt") {
            throw new Error("FILEBASE_UPLOAD_FAILED: CID_NOT_FOUND: x-amz-meta-cid was not present in the S3 upload response headers");
          }
          return {
            cid: "bafybeicidabc123test456789012345678901234567890123456789012",
            bucket: "polylance-db",
            key
          };
        }),
        deleteFile: vi.fn().mockImplementation(async (key) => {
          return true;
        }),
        uploadJson: vi.fn().mockImplementation(async (payload, key) => {
          return {
            cid: "bafybeicidabc123test456789012345678901234567890123456789012",
            bucket: "polylance-db",
            key
          };
        }),
        fetchJson: vi.fn().mockImplementation(async (cid) => {
          if (cid === "invalid-cid-hash") {
            throw new Error("Failed to retrieve state");
          }
          return { jobs: [], profiles: {} };
        })
      };
    })
  };
});

describe("StorageService", () => {
  let mockPrisma: any;
  let storageService: StorageService;

  beforeEach(() => {
    mockPrisma = {
      fileMetadata: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          return {
            id: "uuid-1234",
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data
          };
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.id === "non-existent") return null;
          return {
            id: where.id,
            ownerId: "owner-1",
            walletAddress: "0x123",
            fileName: "portfolio.pdf",
            mimeType: "application/pdf",
            size: 1000,
            cid: "bafybeicidabc123test456789012345678901234567890123456789012",
            storageProvider: "filebase-ipfs",
            storageBucket: "polylance-db",
            storageKey: "portfolio/owner-1/12345_portfolio.pdf",
            visibility: "public",
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }),
        delete: vi.fn().mockImplementation(async ({ where }) => {
          return { id: where.id };
        })
      }
    };

    storageService = new StorageService(mockPrisma);
  });

  it("should successfully upload a supported file and persist metadata", async () => {
    const buffer = Buffer.from("pdf-content");
    const result = await storageService.uploadFile(
      buffer,
      {
        walletAddress: "0x1234567890123456789012345678901234567890",
        fileName: "portfolio.pdf",
        mimeType: "application/pdf",
        size: buffer.length,
      },
      "portfolio"
    );

    expect(result.id).toBe("uuid-1234");
    expect(result.cid).toBe("bafybeicidabc123test456789012345678901234567890123456789012");
    expect(result.fileName).toBe("portfolio.pdf");
    expect(mockPrisma.fileMetadata.create).toHaveBeenCalled();
  });

  it("should reject files exceeding max file size limit", async () => {
    storageService.setMaxFileSize(10); // 10 bytes limit
    const buffer = Buffer.from("this is a long buffer that exceeds ten bytes");
    
    await expect(
      storageService.uploadFile(
        buffer,
        {
          walletAddress: "0x123",
          fileName: "large.pdf",
          mimeType: "application/pdf",
          size: buffer.length,
        },
        "portfolio"
      )
    ).rejects.toThrow("FILE_TOO_LARGE");
  });

  it("should reject unsupported file mime types", async () => {
    const buffer = Buffer.from("executable-binary");
    
    await expect(
      storageService.uploadFile(
        buffer,
        {
          walletAddress: "0x123",
          fileName: "game.exe",
          mimeType: "application/x-msdownload",
          size: buffer.length,
        },
        "portfolio"
      )
    ).rejects.toThrow("UNSUPPORTED_MIME_TYPE");
  });

  it("should sanitize filenames to prevent path traversal attempts", async () => {
    const buffer = Buffer.from("test");
    const result = await storageService.uploadFile(
      buffer,
      {
        walletAddress: "0x123",
        fileName: "../../../etc/passwd",
        mimeType: "application/json",
        size: buffer.length,
      },
      "profiles"
    );

    expect(result.fileName).toBe("passwd");
    expect(result.storageKey).toContain("profiles/");
    expect(result.storageKey).not.toContain("..");
  });

  it("should handle Filebase upload failures cleanly", async () => {
    const buffer = Buffer.from("error-trigger");
    
    await expect(
      storageService.uploadFile(
        buffer,
        {
          walletAddress: "0x123",
          fileName: "trigger-error.txt",
          mimeType: "application/json",
          size: buffer.length,
        },
        "profiles"
      )
    ).rejects.toThrow("FILEBASE_UPLOAD_FAILED");
  });

  it("should handle missing CID headers from Filebase cleanly", async () => {
    const buffer = Buffer.from("test-content");
    
    await expect(
      storageService.uploadFile(
        buffer,
        {
          walletAddress: "0x123",
          fileName: "missing-cid.txt",
          mimeType: "application/json",
          size: buffer.length,
        },
        "profiles"
      )
    ).rejects.toThrow("CID_NOT_FOUND");
  });

  it("should correctly fetch CID and metadata by id", async () => {
    const metadata = await storageService.getFileMetadata("uuid-1234");
    expect(metadata).not.toBeNull();
    expect(metadata?.cid).toBe("bafybeicidabc123test456789012345678901234567890123456789012");

    const cid = await storageService.getCID("uuid-1234");
    expect(cid).toBe("bafybeicidabc123test456789012345678901234567890123456789012");
  });

  it("should verify correct IPFS CID structure", async () => {
    const res = await storageService.verifyCID("bafybeicidabc123test456789012345678901234567890123456789012");
    expect(res.success).toBe(true);
    expect(res.message).toBe("Verified");

    const res2 = await storageService.verifyCID("invalid-cid-hash");
    expect(res2.success).toBe(false);
  });

  it("should construct correct gateway URL using environment variable or default", async () => {
    const cid = "bafybeicidabc123test456789012345678901234567890123456789012";
    const url = storageService.getGatewayURL(cid);
    expect(url).toContain("https://ipfs.filebase.io/ipfs/");
    expect(url).toContain(cid);
  });

  it("should successfully upload global state JSON payload", async () => {
    const payload = { jobs: [], profiles: {} };
    const cid = await storageService.uploadJsonState(payload);
    expect(cid).toBe("bafybeicidabc123test456789012345678901234567890123456789012");
  });

  it("should successfully fetch global state JSON payload", async () => {
    const state = await storageService.getJsonState("bafybeicidabc123test456789012345678901234567890123456789012");
    expect(state).toHaveProperty("jobs");
    expect(state).toHaveProperty("profiles");
  });
});
