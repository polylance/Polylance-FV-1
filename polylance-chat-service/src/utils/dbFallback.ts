import fs from "fs";
import path from "path";

const localStateDbPath = path.resolve(process.cwd(), "local_state_db.json");
const localFilesDbPath = path.resolve(process.cwd(), "local_files_db.json");

export function getLocalStateCid(): string {
  try {
    if (fs.existsSync(localStateDbPath)) {
      const data = JSON.parse(fs.readFileSync(localStateDbPath, "utf8"));
      return data.cid || "";
    }
  } catch (err) {
    console.warn("[FALLBACK] Error reading local state DB:", err);
  }
  return "";
}

export function saveLocalStateCid(cid: string): void {
  try {
    fs.writeFileSync(localStateDbPath, JSON.stringify({ cid, updatedAt: new Date().toISOString() }), "utf8");
    console.log("[FALLBACK] Saved active state CID to local file:", cid);
  } catch (err) {
    console.error("[FALLBACK] Error saving local state DB:", err);
  }
}

export interface LocalFileMetadata {
  id: string;
  walletAddress: string;
  fileName: string;
  mimeType: string;
  size: number;
  cid: string;
  storageProvider: string;
  storageBucket: string;
  storageKey: string;
  visibility: string;
}

export function getLocalFileMetadata(id: string): LocalFileMetadata | null {
  try {
    if (fs.existsSync(localFilesDbPath)) {
      const files = JSON.parse(fs.readFileSync(localFilesDbPath, "utf8"));
      return files[id] || null;
    }
  } catch (err) {
    console.warn("[FALLBACK] Error reading local files DB:", err);
  }
  return null;
}

export function saveLocalFileMetadata(metadata: LocalFileMetadata): void {
  try {
    let files: Record<string, LocalFileMetadata> = {};
    if (fs.existsSync(localFilesDbPath)) {
      files = JSON.parse(fs.readFileSync(localFilesDbPath, "utf8"));
    }
    files[metadata.id] = metadata;
    fs.writeFileSync(localFilesDbPath, JSON.stringify(files, null, 2), "utf8");
    console.log("[FALLBACK] Logged file metadata locally:", metadata.id);
  } catch (err) {
    console.error("[FALLBACK] Error saving local files DB:", err);
  }
}

export function deleteLocalFileMetadata(id: string): void {
  try {
    if (fs.existsSync(localFilesDbPath)) {
      const files = JSON.parse(fs.readFileSync(localFilesDbPath, "utf8"));
      if (files[id]) {
        delete files[id];
        fs.writeFileSync(localFilesDbPath, JSON.stringify(files, null, 2), "utf8");
        console.log("[FALLBACK] Deleted file metadata locally:", id);
      }
    }
  } catch (err) {
    console.error("[FALLBACK] Error deleting local file metadata:", err);
  }
}
