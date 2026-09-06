import { getPublicStats } from "../../../../lib/indexing/publicStats";

export async function GET() {
  try {
    const stats = await getPublicStats();
    return Response.json(stats);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
