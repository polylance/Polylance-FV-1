import { getPersonalStats } from "../../../../lib/indexing/personalStats";
import { verifyWalletAuth } from "../../../../lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  let address = url.searchParams.get("address") || req.headers.get("x-wallet-address");

  if (!address) {
    const authed = await verifyWalletAuth(req);
    if (!authed) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    address = req.headers.get("x-wallet-address");
  }

  if (!address) {
    return Response.json({ error: "Wallet address required" }, { status: 400 });
  }

  try {
    const stats = await getPersonalStats(address);
    return Response.json(stats);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
