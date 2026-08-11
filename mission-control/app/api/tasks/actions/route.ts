import { refreshFixtures, resetFixtures } from "@/lib/task-store";

export async function POST(request: Request) {
  try {
    const { action } = (await request.json()) as { action?: string };
    if (action === "refresh") await refreshFixtures();
    else if (action === "reset") await resetFixtures();
    else return Response.json({ error: "Unknown action." }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update the demo." },
      { status: 500 },
    );
  }
}
