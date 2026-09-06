import { uploadFile, uploadJSON } from "../../../lib/ipfs/upload";
import { verifyWalletAuth } from "../../../lib/auth";
import { checkUploadRateLimit, checkUploadVolumeLimit } from "../../../lib/ratelimit/uploadLimiter";

export async function POST(req: Request) {
  const authed = await verifyWalletAuth(req);
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit 1: per-wallet upload request count (10 uploads per 10 min)
  const countRes = await checkUploadRateLimit(authed.address);
  if (!countRes.success) {
    console.log(JSON.stringify({ event: "rate_limited", route: "/api/ipfs/upload", identifier: authed.address, type: "count" }));
    const retryAfter = Math.ceil((countRes.reset - Date.now()) / 1000);
    return Response.json(
      { error: "Rate limit exceeded", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const data = await req.json();
      const payloadSize = Buffer.byteLength(JSON.stringify(data));

      // Rate limit 2: per-wallet upload volume limit
      const volumeRes = await checkUploadVolumeLimit(authed.address, payloadSize);
      if (!volumeRes.success) {
        console.log(JSON.stringify({ event: "rate_limited", route: "/api/ipfs/upload", identifier: authed.address, type: "volume" }));
        return Response.json({ error: "Upload volume limit exceeded" }, { status: 429 });
      }

      const result = await uploadJSON(data);
      return Response.json(result);
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Rate limit 2: per-wallet upload volume limit
    const volumeRes = await checkUploadVolumeLimit(authed.address, file.size);
    if (!volumeRes.success) {
      console.log(JSON.stringify({ event: "rate_limited", route: "/api/ipfs/upload", identifier: authed.address, type: "volume" }));
      return Response.json({ error: "Upload volume limit exceeded" }, { status: 429 });
    }

    const result = await uploadFile(file);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
