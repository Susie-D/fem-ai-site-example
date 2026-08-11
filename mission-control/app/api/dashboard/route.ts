import { fixtureDashboard } from "@/lib/fixtures";
import { listTasks } from "@/lib/task-store";

export async function GET() {
  try {
    return Response.json({ ...fixtureDashboard, tasks: await listTasks() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load the dashboard." },
      { status: 500 },
    );
  }
}
