import calendar from "@/fixtures/mission-control-fixtures/calendar.json";
import gmail from "@/fixtures/mission-control-fixtures/gmail.json";
import slack from "@/fixtures/mission-control-fixtures/slack.json";
import taskFixtures from "@/fixtures/mission-control-fixtures/tasks.json";

export type TaskStatus = "urgent" | "todo" | "blocked" | "backlog" | "done";
export type TaskSource = "slack" | "gmail" | "calendar" | "manual";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  source: TaskSource;
  person: string;
  dueAt: string | null;
  sourceId: string | null;
  waitingOn: string | null;
  url: string | null;
  origin: "fixture" | "manual";
  createdAt?: string;
  updatedAt?: string;
};

export const fixtureTasks: Task[] = taskFixtures.tasks.map((task) => ({
  ...task,
  status: task.status as TaskStatus,
  source: task.source as TaskSource,
  dueAt: task.dueAt ?? null,
  sourceId: task.sourceId ?? null,
  waitingOn: "waitingOn" in task ? (task.waitingOn ?? null) : null,
  url: task.url ?? null,
  origin: "fixture",
}));

export const fixtureDashboard = {
  referenceDate: taskFixtures.referenceDate,
  timeZone: taskFixtures.timeZone,
  messages: [
    ...slack.messages.map((message) => ({ ...message, kind: "slack" as const })),
    ...gmail.messages.map((message) => ({ ...message, kind: "gmail" as const })),
  ],
  events: calendar.events,
};
