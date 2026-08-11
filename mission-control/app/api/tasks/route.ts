import { createTask } from "@/lib/task-store";

export async function POST(request: Request) {
  try {
    const task = await createTask(await request.json());
    return Response.json({ task }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to add the task." },
      { status: 400 },
    );
  }
}
