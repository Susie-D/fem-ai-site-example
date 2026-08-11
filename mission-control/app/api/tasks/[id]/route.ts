import { updateTaskStatus } from "@/lib/task-store";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { status } = (await request.json()) as { status?: string };
    await updateTaskStatus(id, status ?? "");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update the task." },
      { status: 400 },
    );
  }
}
