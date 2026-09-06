import { useState } from "react";
import { UploadResult } from "../lib/ipfs/upload";

export function useIpfsUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function upload(files: File[], authHeaders?: Record<string, string>): Promise<UploadResult[]> {
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const results: UploadResult[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ipfs/upload", {
        method: "POST",
        headers: {
          ...(authHeaders || {}),
        },
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Upload failed" }));
        setUploading(false);
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
      }
      const data = await res.json();
      results.push(data);
      setProgress((p) => ({ done: (p?.done ?? 0) + 1, total: files.length }));
    }

    setUploading(false);
    return results;
  }

  return { upload, uploading, progress };
}
