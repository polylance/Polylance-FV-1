import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export class FilebaseIpfsService {
  private s3: S3Client | null = null;
  private bucket: string;
  private useRpc: boolean = false;
  private rpcToken: string = "";
  private rpcEndpoint: string = "";

  constructor() {
    this.bucket = process.env.FILEBASE_BUCKET || "polylance-db";
    const accessKey = process.env.FILEBASE_ACCESS_KEY;
    const secretKey = process.env.FILEBASE_SECRET_KEY;
    const endpoint = process.env.FILEBASE_ENDPOINT || "https://s3.filebase.io";
    const region = process.env.FILEBASE_REGION || "auto";

    // Detect if IPFS RPC API endpoint or token is configured
    this.rpcEndpoint = process.env.FILEBASE_RPC_ENDPOINT || "https://rpc.filebase.io";
    
    if (process.env.FILEBASE_RPC_TOKEN) {
      this.rpcToken = process.env.FILEBASE_RPC_TOKEN;
      this.useRpc = true;
    } else if (accessKey && secretKey && this.bucket && accessKey !== "YOUR_FILEBASE_KEY") {
      // Programmatically generate token: base64(accessKey:secretKey:bucket)
      this.rpcToken = Buffer.from(`${accessKey}:${secretKey}:${this.bucket}`).toString("base64");
      this.useRpc = true;
    }

    if (!this.useRpc && accessKey && secretKey && accessKey !== "YOUR_FILEBASE_KEY") {
      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true,
      });
    }

    if (this.useRpc) {
      console.log(`[STORAGE] Operating in IPFS RPC API mode at ${this.rpcEndpoint}`);
    } else if (this.s3) {
      console.log(`[STORAGE] Operating in S3 Compatibility API mode at ${endpoint}`);
    } else {
      console.warn("[STORAGE] Operating in MOCK mode for Filebase IPFS storage.");
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    storageKey: string
  ): Promise<{ cid: string; bucket: string; key: string }> {
    if (!this.useRpc && !this.s3) {
      // Mock mode: generate deterministic but mock IPFS CID v1 format
      const mockCid = "bafybeimock" + Math.random().toString(36).slice(2, 12) + "mock";
      return { cid: mockCid, bucket: this.bucket, key: storageKey };
    }

    // 1. IPFS RPC API upload path
    if (this.useRpc) {
      try {
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: mimeType });
        formData.append("file", blob, fileName);

        const response = await fetch(`${this.rpcEndpoint}/api/v0/add`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.rpcToken}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`RPC error: ${response.statusText} - ${errorText}`);
        }

        const data: any = await response.json();
        const cid = data.Hash;

        if (!cid) {
          throw new Error("CID was not returned by the Filebase IPFS RPC API");
        }

        return { cid, bucket: this.bucket, key: storageKey };
      } catch (err: any) {
        console.error("[STORAGE] Filebase RPC Upload Error:", err);
        throw new Error(`FILEBASE_UPLOAD_FAILED: ${err.message}`);
      }
    }

    // 2. S3 Compatibility API upload path
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      let cid = "";
      // Filebase returns the CID in headers. Intercept it using middleware.
      command.middlewareStack.add(
        (next) => async (args) => {
          const response = await next(args);
          const rawResponse = (response as any).response;
          if (rawResponse && rawResponse.headers) {
            cid = rawResponse.headers["x-amz-meta-cid"] || "";
          }
          return response;
        },
        { step: "build" }
      );

      await this.s3!.send(command);

      if (!cid) {
        throw new Error("CID_NOT_FOUND: x-amz-meta-cid was not present in the S3 upload response headers");
      }

      return { cid, bucket: this.bucket, key: storageKey };
    } catch (err: any) {
      console.error("[STORAGE] Filebase S3 Upload Error:", err);
      throw new Error(`FILEBASE_UPLOAD_FAILED: ${err.message}`);
    }
  }

  async deleteFile(storageKey: string, cid?: string): Promise<boolean> {
    if (!this.useRpc && !this.s3) return true;

    // 1. IPFS RPC API delete/rm path
    if (this.useRpc && cid) {
      try {
        const response = await fetch(`${this.rpcEndpoint}/api/v0/pin/rm?arg=${cid}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.rpcToken}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[STORAGE] IPFS RPC pin/rm warning: ${response.statusText} - ${errorText}`);
          return false;
        }

        return true;
      } catch (err) {
        console.error("[STORAGE] Filebase RPC delete error:", err);
        return false;
      }
    }

    // 2. S3 Compatibility API delete path
    try {
      await this.s3!.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        })
      );
      return true;
    } catch (err) {
      console.error("[STORAGE] Filebase S3 Delete Error:", err);
      return false;
    }
  }

  async uploadJson(
    payload: object,
    storageKey: string
  ): Promise<{ cid: string; bucket: string; key: string }> {
    const jsonStr = JSON.stringify(payload);
    const buffer = Buffer.from(jsonStr, "utf-8");
    return this.uploadFile(buffer, "state.json", "application/json", storageKey);
  }

  async fetchJson(cid: string): Promise<any> {
    const gateways = [
      `https://ipfs.filebase.io/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`
    ];

    for (const url of gateways) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(url, { signal: controller.signal }).catch(() => null);
        clearTimeout(timeoutId);

        if (response && response.ok) {
          const json = await response.json().catch(() => null);
          if (json) return json;
        }
      } catch (e) {
        // try next
      }
    }
    throw new Error(`Failed to retrieve state JSON from IPFS gateways for CID: ${cid}`);
  }
}
