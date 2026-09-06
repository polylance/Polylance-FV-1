import { getAdminStats } from "../../../../lib/indexing/adminStats";
import { verifyWalletAuth } from "../../../../lib/auth";

export async function GET(req: Request) {
  const authed = await verifyWalletAuth(req);
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getAdminStats();
    return Response.json(stats);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
