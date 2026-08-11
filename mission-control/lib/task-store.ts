import { env } from "cloudflare:workers";
import { fixtureTasks, type Task, type TaskSource, type TaskStatus } from "./fixtures";

const statuses: TaskStatus[] = ["urgent", "todo", "blocked", "backlog", "done"];
const sources: TaskSource[] = ["slack", "gmail", "calendar", "manual"];

function database() {
  if (!env.DB) throw new Error("Mission Control storage is unavailable.");
  return env.DB;
}

function insertStatement(task: Task) {
  return database()
    .prepare(`INSERT OR IGNORE INTO tasks
      (id, title, description, status, source, person, due_at, source_id, waiting_on, url, origin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      task.id,
      task.title,
      task.description,
      task.status,
      task.source,
      task.person,
      task.dueAt,
      task.sourceId,
      task.waitingOn,
      task.url,
      task.origin,
    );
}

export async function ensureTasks() {
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      person TEXT NOT NULL DEFAULT '',
      due_at TEXT,
      source_id TEXT,
      waiting_on TEXT,
      url TEXT,
      origin TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks (source)"),
  ]);

  const row = await db.prepare("SELECT COUNT(*) AS count FROM tasks").first<{ count: number }>();
  if (!row?.count) await db.batch(fixtureTasks.map(insertStatement));
}

export async function listTasks(): Promise<Task[]> {
  await ensureTasks();
  const result = await database()
    .prepare(`SELECT id, title, description, status, source, person,
      due_at AS dueAt, source_id AS sourceId, waiting_on AS waitingOn,
      url, origin, created_at AS createdAt, updated_at AS updatedAt
      FROM tasks ORDER BY CASE status
        WHEN 'urgent' THEN 1 WHEN 'todo' THEN 2 WHEN 'blocked' THEN 3
        WHEN 'backlog' THEN 4 ELSE 5 END, due_at IS NULL, due_at, created_at`)
    .all<Task>();
  return result.results;
}

export async function createTask(input: {
  title?: string;
  description?: string;
  status?: string;
  person?: string;
  dueAt?: string | null;
}) {
  await ensureTasks();
  const title = input.title?.trim() ?? "";
  const status = statuses.includes(input.status as TaskStatus)
    ? (input.status as TaskStatus)
    : "todo";
  if (!title) throw new Error("Add a task title.");
  const task: Task = {
    id: `manual-${crypto.randomUUID()}`,
    title,
    description: input.description?.trim() ?? "",
    status,
    source: "manual",
    person: input.person?.trim() ?? "",
    dueAt: input.dueAt || null,
    sourceId: null,
    waitingOn: null,
    url: null,
    origin: "manual",
  };
  await database().batch([insertStatement(task)]);
  return task;
}

export async function updateTaskStatus(id: string, status: string) {
  await ensureTasks();
  if (!statuses.includes(status as TaskStatus)) throw new Error("Choose a valid status.");
  const result = await database()
    .prepare("UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(status, id)
    .run();
  if (!result.meta.changes) throw new Error("Task not found.");
}

export async function refreshFixtures() {
  await ensureTasks();
  await database().batch(fixtureTasks.map(insertStatement));
}

export async function resetFixtures() {
  await ensureTasks();
  const db = database();
  await db.batch([db.prepare("DELETE FROM tasks"), ...fixtureTasks.map(insertStatement)]);
}

export function isSource(value: string): value is TaskSource {
  return sources.includes(value as TaskSource);
}
