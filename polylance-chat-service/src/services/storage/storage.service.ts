import { FilebaseIpfsService } from "./filebase-ipfs.service.js";
import { saveLocalFileMetadata, getLocalFileMetadata, deleteLocalFileMetadata } from "../../utils/dbFallback.js";
import crypto from "crypto";
export interface FileMetadataInput {
  ownerId?: string;
  walletAddress: string;
  fileName: string;
  mimeType: string;
  size: number;
  visibility?: "public" | "private";
  entityType?: string;
  entityId?: string;
}

export class StorageService {
  private provider: FilebaseIpfsService;
  private prisma: any;

  // Maximum allowed file size in bytes (default 50 MB)
  private maxFileSize = 50 * 1024 * 1024;

  private allowedMimeTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/json"
  ]);

  constructor(prismaInstance: any) {
    this.provider = new FilebaseIpfsService();
    this.prisma = prismaInstance;
  }

  setMaxFileSize(size: number) {
    this.maxFileSize = size;
  }

  setAllowedMimeTypes(types: string[]) {
    this.allowedMimeTypes = new Set(types);
  }

  private sanitizeFilename(name: string): string {
    const base = name.replace(/^.*[\\\/]/, '');
    return base.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }

  private generateStoragePath(category: string, entityId: string | undefined, fileName: string): string {
    const cleanName = this.sanitizeFilename(fileName);
    const idPrefix = entityId ? this.sanitizeFilename(entityId) : "general";
    const timestamp = Date.now();
    return `${category}/${idPrefix}/${timestamp}_${cleanName}`;
  }

  async uploadFile(
    fileBuffer: Buffer,
    input: FileMetadataInput,
    category: string
  ) {
    // 1. Validate file size
    if (input.size > this.maxFileSize) {
      throw new Error(`FILE_TOO_LARGE: Maximum allowed size is ${this.maxFileSize / (1024 * 1024)} MB`);
    }

    // 2. Validate MIME type
    if (!this.allowedMimeTypes.has(input.mimeType)) {
      throw new Error(`UNSUPPORTED_MIME_TYPE: File type ${input.mimeType} is not supported`);
    }

    // 3. Generate safe storage key path
    const storageKey = this.generateStoragePath(category, input.entityId || input.ownerId || input.walletAddress, input.fileName);

    // 4. Upload to S3/Filebase
    let uploadResult;
    try {
      uploadResult = await this.provider.uploadFile(
        fileBuffer,
        input.fileName,
        input.mimeType,
        storageKey
      );
    } catch (err: any) {
      throw new Error(`FILEBASE_UPLOAD_FAILED: ${err.message}`);
    }

    // 5. Store metadata in Postgres database via Prisma
    const fileName = this.sanitizeFilename(input.fileName);
    let metadata: any;
    try {
      metadata = await this.prisma.fileMetadata.create({
        data: {
          ownerId: input.ownerId || null,
          walletAddress: input.walletAddress.toLowerCase(),
          fileName,
          mimeType: input.mimeType,
          size: input.size,
          cid: uploadResult.cid,
          storageProvider: "filebase-ipfs",
          storageBucket: uploadResult.bucket,
          storageKey: uploadResult.key,
          visibility: input.visibility || "public",
          entityType: input.entityType || null,
          entityId: input.entityId || null,
        },
      });
    } catch (dbErr: any) {
      const fallbackId = crypto.randomUUID();
      const metadataPayload = {
        id: fallbackId,
        ownerId: input.ownerId || null,
        walletAddress: input.walletAddress.toLowerCase(),
        fileName,
        mimeType: input.mimeType,
        size: input.size,
        cid: uploadResult.cid,
        storageProvider: "filebase-ipfs",
        storageBucket: uploadResult.bucket,
        storageKey: uploadResult.key,
        visibility: input.visibility || "public",
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.warn("[STORAGE] Database save failed, saving file metadata locally:", dbErr.message);
      saveLocalFileMetadata(metadataPayload);
      metadata = metadataPayload;
    }

    return metadata;
  }

  async getFileMetadata(id: string) {
    try {
      const file = await this.prisma.fileMetadata.findUnique({ where: { id } }).catch(() => null);
      return file || getLocalFileMetadata(id);
    } catch (dbErr: any) {
      console.warn("[STORAGE] Database query failed, reading metadata locally:", dbErr.message);
      return getLocalFileMetadata(id);
    }
  }

  async getCID(id: string): Promise<string | null> {
    const file = await this.getFileMetadata(id);
    return file ? file.cid : null;
  }

  async deleteFile(id: string): Promise<boolean> {
    const file = await this.getFileMetadata(id);
    if (!file) return false;

    // Delete from Filebase storage
    const storageDeleted = await this.provider.deleteFile(file.storageKey, file.cid);

    // Remove from metadata database log
    if (storageDeleted) {
      try {
        await this.prisma.fileMetadata.delete({ where: { id } });
      } catch (dbErr: any) {
        console.warn("[STORAGE] Database delete failed, deleting metadata locally:", dbErr.message);
      }
      deleteLocalFileMetadata(id);
      return true;
    }
    return false;
  }

  getGatewayURL(cid: string): string {
    const gatewayBase = process.env.IPFS_GATEWAY_URL || "https://ipfs.filebase.io/ipfs/";
    const cleanCid = cid.replace("ipfs://", "");
    return `${gatewayBase}${cleanCid}`;
  }

  async verifyCID(cid: string): Promise<{ success: boolean; message: string; gatewayUrl?: string }> {
    if (!cid || typeof cid !== "string") {
      return { success: false, message: "Invalid CID format" };
    }
    // Verify it is a valid IPFS CID v0 or v1 format (typically Qm... or baf/bafy...)
    const valid = cid.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{50,60})$/i);
    if (!valid) {
      return { success: false, message: "Invalid cryptographic IPFS hash structure" };
    }
    return {
      success: true,
      message: "Verified",
      gatewayUrl: this.getGatewayURL(cid)
    };
  }

  async uploadJsonState(payload: object): Promise<string> {
    const uploadResult = await this.provider.uploadJson(payload, "state/global_state.json");
    return uploadResult.cid;
  }

  async getJsonState(cid: string): Promise<any> {
    return await this.provider.fetchJson(cid);
  }
}
