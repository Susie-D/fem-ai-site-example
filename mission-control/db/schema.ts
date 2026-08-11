import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull(),
    source: text("source").notNull(),
    person: text("person").notNull().default(""),
    dueAt: text("due_at"),
    sourceId: text("source_id"),
    waitingOn: text("waiting_on"),
    url: text("url"),
    origin: text("origin").notNull().default("manual"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_tasks_status").on(table.status),
    index("idx_tasks_source").on(table.source),
  ],
);
