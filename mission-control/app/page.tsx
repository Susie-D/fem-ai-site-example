"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Task, TaskSource, TaskStatus } from "@/lib/fixtures";

type Message = {
  id: string;
  kind: "slack" | "gmail";
  needsResponse: boolean;
  author?: string;
  from?: string;
  channel?: string;
  subject?: string;
  text?: string;
  preview?: string;
};

type Event = { id: string; title: string; startsAt: string; endsAt: string };
type DashboardData = {
  referenceDate: string;
  timeZone: string;
  tasks: Task[];
  messages: Message[];
  events: Event[];
};

const columns: { id: TaskStatus; label: string }[] = [
  { id: "urgent", label: "Urgent" },
  { id: "todo", label: "To do" },
  { id: "blocked", label: "Blocked" },
  { id: "backlog", label: "Backlog" },
  { id: "done", label: "Done" },
];

const sources: { id: "all" | TaskSource; label: string }[] = [
  { id: "all", label: "All" },
  { id: "slack", label: "Slack" },
  { id: "gmail", label: "Gmail" },
  { id: "calendar", label: "Calendar" },
  { id: "manual", label: "Manual" },
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

function formatDue(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(date);
  return `${day} · ${formatTime(value)}`;
}

function shortPerson(value: string) {
  return value.replace(/\s*<.*>/, "");
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [filter, setFilter] = useState<"all" | TaskSource>("all");
  const [selected, setSelected] = useState<Task | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const createDialog = useRef<HTMLDialogElement>(null);

  async function load() {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const next = (await response.json()) as DashboardData & { error?: string };
    if (!response.ok) throw new Error(next.error || "Unable to load Mission Control.");
    setData(next);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const next = (await response.json()) as DashboardData & { error?: string };
        if (!response.ok) throw new Error(next.error || "Unable to load Mission Control.");
        return next;
      })
      .then((next) => { if (active) setData(next); })
      .catch((error) => { if (active) setNotice(error.message); });
    return () => { active = false; };
  }, []);

  const filteredTasks = useMemo(
    () => data?.tasks.filter((task) => filter === "all" || task.source === filter) ?? [],
    [data, filter],
  );

  function openDetails(task: Task) {
    setSelected(task);
    detailDialog.current?.showModal();
  }

  async function runAction(action: "refresh" | "reset") {
    if (action === "reset" && !window.confirm("Reset the board to the original fictional data? Manual tasks will be removed.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/tasks/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("The demo could not be updated.");
      await load();
      setNotice(action === "refresh" ? "Fixture data refreshed. Your changes are intact." : "Demo data reset.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: TaskStatus) {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/tasks/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("The task could not be updated.");
      setSelected({ ...selected, status });
      await load();
      setNotice("Task moved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "The task could not be added.");
      formElement.reset();
      createDialog.current?.close();
      await load();
      setNotice("Manual task added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const priorities = data?.tasks.filter((task) => task.status === "urgent") ?? [];
  const responses = data?.messages.filter((message) => message.needsResponse) ?? [];
  const todayEvents = data?.events.filter((event) => event.startsAt.startsWith("2026-08-11")) ?? [];
  const waiting = data?.tasks.filter((task) => task.status === "blocked" && task.waitingOn) ?? [];
  const deadlines = data?.tasks
    .filter((task) => task.dueAt && task.status !== "done")
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""))
    .slice(0, 4) ?? [];

  return (
    <main>
      <header className="site-header">
        <div>
          <p className="date-line">Tuesday, August 11</p>
          <h1>Mission Control</h1>
        </div>
        <div className="header-actions">
          <button className="button quiet" onClick={() => runAction("refresh")} disabled={busy}>Refresh</button>
          <button className="button quiet" onClick={() => runAction("reset")} disabled={busy}>Reset demo</button>
          <button className="button primary" onClick={() => createDialog.current?.showModal()}>Add task</button>
        </div>
      </header>

      <section aria-labelledby="overview-title" className="section-block">
        <div className="section-heading">
          <h2 id="overview-title">Day at a glance</h2>
          <span className="time-chip">9:30 AM · Chicago</span>
        </div>
        <div className="overview-grid">
          <article className="overview-card priorities-card">
            <div className="card-top"><h3>Top priorities</h3><span>{priorities.length}</span></div>
            <ol className="priority-list">
              {priorities.map((task, index) => (
                <li key={task.id}>
                  <button onClick={() => openDetails(task)}>
                    <span>{index + 1}</span><strong>{task.title}</strong><small>{formatTime(task.dueAt!)}</small>
                  </button>
                </li>
              ))}
            </ol>
          </article>

          <article className="overview-card messages-card">
            <div className="card-top"><h3>Needs a response</h3><span>{responses.length}</span></div>
            <ul className="compact-list">
              {responses.slice(0, 4).map((message) => (
                <li key={message.id}>
                  <i className={`source-dot ${message.kind}`} aria-hidden="true" />
                  <div><strong>{shortPerson(message.author || message.from || "")}</strong><small>{message.subject || message.channel}</small></div>
                </li>
              ))}
            </ul>
          </article>

          <article className="overview-card schedule-card">
            <div className="card-top"><h3>Schedule</h3><span>{todayEvents.length}</span></div>
            <ol className="timeline-list">
              {todayEvents.map((event) => (
                <li key={event.id}><time>{formatTime(event.startsAt)}</time><strong>{event.title}</strong></li>
              ))}
            </ol>
          </article>

          <article className="overview-card waiting-card">
            <div className="card-top"><h3>Waiting on</h3><span>{waiting.length}</span></div>
            <ul className="compact-list waiting-list">
              {waiting.map((task) => (
                <li key={task.id}><span className="avatar">{task.waitingOn?.[0]}</span><div><strong>{task.waitingOn}</strong><small>{task.title}</small></div></li>
              ))}
            </ul>
          </article>

          <article className="overview-card deadlines-card">
            <div className="card-top"><h3>Deadlines</h3><span>{deadlines.length}</span></div>
            <ul className="deadline-list">
              {deadlines.map((task) => (
                <li key={task.id}><button onClick={() => openDetails(task)}><time>{formatTime(task.dueAt!)}</time><span>{task.title}</span></button></li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section aria-labelledby="board-title" className="section-block board-section">
        <div className="section-heading board-heading">
          <h2 id="board-title">Task board</h2>
          <div className="filters" aria-label="Filter tasks by source">
            {sources.map((source) => (
              <button key={source.id} className={filter === source.id ? "active" : ""} aria-pressed={filter === source.id} onClick={() => setFilter(source.id)}>{source.label}</button>
            ))}
          </div>
        </div>
        {!data ? (
          <div className="loading-card" role="status">Loading your workday…</div>
        ) : (
          <div className="task-board">
            {columns.map((column) => {
              const tasks = filteredTasks.filter((task) => task.status === column.id);
              return (
                <section className={`task-column ${column.id}`} key={column.id} aria-labelledby={`column-${column.id}`}>
                  <div className="column-title"><h3 id={`column-${column.id}`}>{column.label}</h3><span>{tasks.length}</span></div>
                  <div className="task-stack">
                    {tasks.map((task) => (
                      <button className="task-card" key={task.id} onClick={() => openDetails(task)}>
                        <span className={`source-label ${task.source}`}>{task.source}</span>
                        <strong>{task.title}</strong>
                        <span className="task-meta"><span>{task.person || "Personal"}</span><time>{formatDue(task.dueAt)}</time></span>
                      </button>
                    ))}
                    {!tasks.length && <p className="empty-column">Nothing here</p>}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <dialog ref={detailDialog} className="dialog" onClose={() => setSelected(null)}>
        {selected && (
          <div className="dialog-inner">
            <div className="dialog-top">
              <span className={`source-label ${selected.source}`}>{selected.source}</span>
              <button className="icon-button" onClick={() => detailDialog.current?.close()} aria-label="Close task details">×</button>
            </div>
            <h2>{selected.title}</h2>
            <p>{selected.description || "No description yet."}</p>
            <dl>
              <div><dt>Owner</dt><dd>{selected.person || "Personal"}</dd></div>
              <div><dt>Due</dt><dd>{formatDue(selected.dueAt)}</dd></div>
            </dl>
            <label className="field-label" htmlFor="detail-status">Status</label>
            <select id="detail-status" value={selected.status} onChange={(event) => changeStatus(event.target.value as TaskStatus)} disabled={busy}>
              {columns.map((column) => <option value={column.id} key={column.id}>{column.label}</option>)}
            </select>
            <div className="dialog-actions">
              {selected.url && <a href={selected.url} target="_blank" rel="noreferrer">Open fictional source</a>}
              <button className="button quiet" onClick={() => detailDialog.current?.close()}>Done</button>
            </div>
          </div>
        )}
      </dialog>

      <dialog ref={createDialog} className="dialog">
        <form className="dialog-inner" onSubmit={createTask}>
          <div className="dialog-top"><h2>Add task</h2><button type="button" className="icon-button" onClick={() => createDialog.current?.close()} aria-label="Close new task form">×</button></div>
          <label className="field-label" htmlFor="task-title">Title</label>
          <input id="task-title" name="title" required />
          <label className="field-label" htmlFor="task-description">Description</label>
          <textarea id="task-description" name="description" rows={3} />
          <div className="form-grid">
            <div><label className="field-label" htmlFor="task-status">Status</label><select id="task-status" name="status" defaultValue="todo">{columns.map((column) => <option value={column.id} key={column.id}>{column.label}</option>)}</select></div>
            <div><label className="field-label" htmlFor="task-person">Owner</label><input id="task-person" name="person" placeholder="Optional" /></div>
          </div>
          <label className="field-label" htmlFor="task-due">Due</label>
          <input id="task-due" name="dueAt" type="datetime-local" />
          <div className="dialog-actions"><button type="button" className="button quiet" onClick={() => createDialog.current?.close()}>Cancel</button><button className="button primary" disabled={busy}>Add task</button></div>
        </form>
      </dialog>

      <p className="notice" aria-live="polite">{notice}</p>
    </main>
  );
}
