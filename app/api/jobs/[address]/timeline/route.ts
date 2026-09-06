import { getJobTimeline } from "../../../../../lib/indexing/jobTimeline";

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  if (!params || !params.address) {
    return Response.json({ error: "Job address required" }, { status: 400 });
  }

  try {
    const timeline = await getJobTimeline(params.address);
    return Response.json(timeline);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
