"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddTaskForm, NewTaskInput } from "@/components/AddTaskForm";

type Task = {
  id: string;
  title: string;
  projectKey: string | null;
  dueDate: string;
  dueTime: string | null;
  estimatedMinutes: number | null;
  priority: string;
  completed: boolean;
};

type Project = {
  id: string;
  name: string;
  status: string;
  color: string;
};

const STATUS_OPTIONS = ["BUILDING", "PAUSED", "SHIPPED"] as const;
const STATUS_TO_DB: Record<string, string> = {
  BUILDING: "BUILDING",
  PAUSED: "PAUSED",
  SHIPPED: "DONE",
};
const COLOR_PRESETS = ["#E8FF47", "#47A3FF", "#FF4778", "#47FFB0", "#F7931A", "#7B2FBE"];

type Scope = "TODAY" | "WEEK" | "OVERDUE" | "ALL";

function getDateStr(): string {
  const now = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function addDays(yyyymmdd: string, n: number): string {
  const d = new Date(yyyymmdd + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDueLabel(dueDate: string, today: string): string {
  if (dueDate === today) return "TODAY";
  const d = new Date(dueDate + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff === 1) return "TOMORROW";
  if (diff === -1) return "YESTERDAY";
  if (diff < 0) return `${Math.abs(diff)}D LATE`;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [, m, day] = dueDate.split("-");
  return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`;
}

function formatEstimate(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}M`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}H` : `${h}H${m}`;
}

function compareTasks(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  const at = a.dueTime ?? "99:99";
  const bt = b.dueTime ?? "99:99";
  if (at !== bt) return at < bt ? -1 : 1;
  return 0;
}

export function HomeClient({
  tasks,
  projects,
  today,
  maxStreak,
}: {
  tasks: Task[];
  projects: Project[];
  today: string;
  maxStreak: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dateStr, setDateStr] = useState("");
  const [now, setNow] = useState("");
  const [scope, setScope] = useState<Scope>("TODAY");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<string | null>(null);
  const [projectSheet, setProjectSheet] = useState<
    | null
    | { mode: "add" }
    | { mode: "edit"; project: Project }
    | { mode: "rowActions"; project: Project }
    | { mode: "confirmRemove"; project: Project }
  >(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  useEffect(() => {
    setDateStr(getDateStr());
    setNow(nowHHMM());
    const id = setInterval(() => setNow(nowHHMM()), 30_000);
    return () => clearInterval(id);
  }, []);

  const projectColor = (key: string | null) => {
    if (!key) return "#444";
    return projects.find((p) => p.name === key)?.color ?? "#444";
  };

  const scoped = useMemo(() => {
    const weekEnd = addDays(today, 6);
    let list = tasks.filter((t) => {
      if (projectFilter && t.projectKey !== projectFilter) return false;
      if (scope === "ALL") return true;
      if (scope === "TODAY") return t.dueDate === today;
      if (scope === "WEEK") return t.dueDate >= today && t.dueDate <= weekEnd;
      if (scope === "OVERDUE") return t.dueDate < today && !t.completed;
      return true;
    });
    list = [...list].sort(compareTasks);
    return list;
  }, [tasks, scope, projectFilter, today]);

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === today), [tasks, today]);
  const todayDone = todayTasks.filter((t) => t.completed).length;
  const overdueCount = useMemo(
    () => tasks.filter((t) => t.dueDate < today && !t.completed).length,
    [tasks, today],
  );

  async function toggleTask(id: string, completed: boolean) {
    startTransition(async () => {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !completed }),
      });
      router.refresh();
    });
  }

  async function createTask(input: NewTaskInput) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setShowAddTask(false);
    router.refresh();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    setConfirmDeleteTask(null);
    router.refresh();
  }

  async function createProject(name: string, status: string, color: string) {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status: STATUS_TO_DB[status], color }),
    });
    setProjectSheet(null);
    router.refresh();
  }

  async function editProject(id: string, name: string, status: string, color: string) {
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, status: STATUS_TO_DB[status], color }),
    });
    setProjectSheet(null);
    router.refresh();
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    setProjectSheet(null);
    router.refresh();
  }

  function startLongPress(project: Project) {
    longPressedRef.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressedRef.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
      setProjectSheet({ mode: "rowActions", project });
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  const projectTaskCounts = useMemo(() => {
    const map: Record<string, { todayDone: number; todayTotal: number; total: number }> = {};
    for (const p of projects) {
      map[p.name] = { todayDone: 0, todayTotal: 0, total: 0 };
    }
    for (const t of tasks) {
      if (!t.projectKey || !map[t.projectKey]) continue;
      map[t.projectKey].total += 1;
      if (t.dueDate === today) {
        map[t.projectKey].todayTotal += 1;
        if (t.completed) map[t.projectKey].todayDone += 1;
      }
    }
    return map;
  }, [projects, tasks, today]);

  return (
    <>
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 52, borderBottom: "0.5px solid #222" }}
      >
        <span className="font-impact text-[20px] tracking-wider" style={{ color: "#F0F0F0" }}>
          R2·BUILD
        </span>
        <div className="flex items-center gap-4">
          {overdueCount > 0 && (
            <span
              className="font-mono text-[9px] tracking-wider"
              style={{ color: "#FF4778" }}
            >
              {overdueCount} LATE
            </span>
          )}
          <span className="font-mono text-[9px] tracking-wider" style={{ color: "#444" }}>
            {maxStreak}D STREAK
          </span>
        </div>
      </header>

      {/* Hero */}
      <section
        className="shrink-0 flex flex-col items-center justify-center px-5"
        style={{ paddingTop: 20, paddingBottom: 16, borderBottom: "0.5px solid #1a1a1a" }}
      >
        <p className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444" }}>
          {dateStr || " "}
        </p>
        <p
          className="font-impact leading-none"
          style={{ fontSize: 60, color: "#E8FF47", marginTop: 6 }}
        >
          {todayDone}/{todayTasks.length}
        </p>
        <p className="font-mono text-[10px] tracking-[3px]" style={{ color: "#555", marginTop: 4 }}>
          DONE TODAY
        </p>
      </section>

      {/* Scope tabs */}
      <div
        className="shrink-0 flex items-center gap-2 px-5 overflow-x-auto no-scrollbar"
        style={{ height: 40, borderBottom: "0.5px solid #1a1a1a" }}
      >
        {(["TODAY", "WEEK", "OVERDUE", "ALL"] as Scope[]).map((s) => {
          const active = scope === s;
          return (
            <button
              key={s}
              onClick={() => setScope(s)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3 shrink-0"
              style={{
                height: 24,
                color: active ? "#080808" : "#555",
                background: active ? "#E8FF47" : "transparent",
                border: `1px solid ${active ? "#E8FF47" : "#2a2a2a"}`,
              }}
            >
              {s}
            </button>
          );
        })}
        <div style={{ width: 1, height: 16, background: "#222", margin: "0 4px" }} />
        <button
          onClick={() => setProjectFilter(null)}
          className="btn-press font-mono text-[9px] tracking-[2px] px-3 shrink-0"
          style={{
            height: 24,
            color: projectFilter === null ? "#080808" : "#555",
            background: projectFilter === null ? "#F0F0F0" : "transparent",
            border: `1px solid ${projectFilter === null ? "#F0F0F0" : "#2a2a2a"}`,
          }}
        >
          ALL
        </button>
        {projects.map((p) => {
          const active = projectFilter === p.name;
          return (
            <button
              key={p.name}
              onClick={() => setProjectFilter(active ? null : p.name)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3 shrink-0 flex items-center gap-2"
              style={{
                height: 24,
                color: active ? "#080808" : "#999",
                background: active ? p.color : "transparent",
                border: `1px solid ${active ? p.color : "#2a2a2a"}`,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  background: active ? "#080808" : p.color,
                }}
              />
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Scrolling content */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 120 }}>
        {/* Timeline */}
        {scoped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <p
              className="font-mono text-[10px] tracking-[3px] text-center"
              style={{ color: "#444" }}
            >
              NO TASKS
            </p>
            <p
              className="font-mono text-[9px] tracking-[2px] text-center mt-2"
              style={{ color: "#333" }}
            >
              TAP + TO ADD
            </p>
          </div>
        ) : (
          <Timeline
            items={scoped}
            scope={scope}
            today={today}
            now={now}
            projectColor={projectColor}
            onToggle={(id, completed) => toggleTask(id, completed)}
            onDelete={(id) => setConfirmDeleteTask(id)}
          />
        )}

        {/* Projects section */}
        <div className="px-5" style={{ marginTop: 32 }}>
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: "#555", letterSpacing: "2.5px" }}
            >
              PROJECTS
            </span>
            {projects.length < 6 && (
              <button
                onClick={() => setProjectSheet({ mode: "add" })}
                className="btn-press font-mono text-[10px] tracking-wider"
                style={{ color: "#E8FF47", background: "transparent", border: "none" }}
              >
                + ADD
              </button>
            )}
          </div>
          {projects.length === 0 ? (
            <p
              className="font-mono text-[10px] tracking-[2px]"
              style={{ color: "#333" }}
            >
              NO PROJECTS
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {projects.map((p) => {
                const counts = projectTaskCounts[p.name];
                return (
                  <div
                    key={p.id}
                    onPointerDown={() => startLongPress(p)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    className="btn-press flex items-center"
                    style={{
                      minHeight: 56,
                      gap: 12,
                      borderBottom: "0.5px solid #151515",
                      padding: "8px 4px",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                    }}
                  >
                    <Link
                      href={`/project/${p.id}`}
                      className="flex items-center flex-1 min-w-0"
                      style={{ gap: 12 }}
                      onPointerDown={(e) => {
                        if (longPressedRef.current) {
                          e.preventDefault();
                        }
                      }}
                      onClick={(e) => {
                        if (longPressedRef.current) {
                          e.preventDefault();
                          longPressedRef.current = false;
                        }
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: p.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="font-impact"
                        style={{
                          fontSize: 18,
                          color: "#F0F0F0",
                          letterSpacing: "1px",
                        }}
                      >
                        {p.name}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 9,
                          color: "#444",
                          letterSpacing: "1.5px",
                        }}
                      >
                        {p.status}
                      </span>
                    </Link>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 9,
                        color: "#555",
                        letterSpacing: "1.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {counts ? `${counts.todayDone}/${counts.todayTotal} TODAY` : "0/0 TODAY"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB — add task */}
      <button
        onClick={() => setShowAddTask(true)}
        className="btn-press"
        style={{
          position: "fixed",
          right: 20,
          bottom: 88,
          height: 48,
          paddingLeft: 18,
          paddingRight: 22,
          borderRadius: 24,
          background: "#E8FF47",
          color: "#080808",
          border: "none",
          boxShadow: "0 4px 20px rgba(232,255,71,0.4)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "Impact, sans-serif",
          letterSpacing: "2px",
          fontSize: 16,
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 700 }}>+</span>
        TASK
      </button>

      {/* Add task sheet */}
      {showAddTask && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAddTask(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
            style={{
              background: "#111",
              borderTop: "1px solid #2a2a2a",
              padding: "24px 20px 32px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <AddTaskForm
              projects={projects.map((p) => ({ name: p.name, color: p.color }))}
              today={today}
              onCancel={() => setShowAddTask(false)}
              onSubmit={createTask}
            />
          </div>
        </div>
      )}

      {/* Delete task confirm */}
      {confirmDeleteTask && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setConfirmDeleteTask(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
            style={{
              background: "#111",
              borderTop: "1px solid #2a2a2a",
              padding: "24px 20px 32px",
            }}
          >
            <p className="font-impact mb-2" style={{ fontSize: 20, color: "#F0F0F0", letterSpacing: "1px" }}>
              DELETE TASK?
            </p>
            <p className="font-mono text-[11px] mb-5" style={{ color: "#555" }}>
              This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteTask(null)}
                className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
                style={{
                  height: 48,
                  color: "#F0F0F0",
                  background: "transparent",
                  border: "1px solid #2a2a2a",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => deleteTask(confirmDeleteTask)}
                className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
                style={{
                  height: 48,
                  color: "#FF4747",
                  background: "transparent",
                  border: "1px solid #FF4747",
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project sheet */}
      {projectSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setProjectSheet(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
            style={{
              background: "#111",
              borderTop: "1px solid #2a2a2a",
              padding: "24px 20px 32px",
            }}
          >
            {projectSheet.mode === "add" && (
              <ProjectForm
                title="NEW PROJECT"
                submitLabel="ADD PROJECT"
                onCancel={() => setProjectSheet(null)}
                onSubmit={(name, status, color) => createProject(name, status, color)}
              />
            )}
            {projectSheet.mode === "edit" && (
              <ProjectForm
                title="EDIT PROJECT"
                submitLabel="SAVE"
                initialName={projectSheet.project.name}
                initialStatus={
                  projectSheet.project.status === "DONE"
                    ? "SHIPPED"
                    : projectSheet.project.status === "PAUSED"
                    ? "PAUSED"
                    : "BUILDING"
                }
                initialColor={projectSheet.project.color}
                onCancel={() => setProjectSheet(null)}
                onSubmit={(name, status, color) =>
                  editProject(projectSheet.project.id, name, status, color)
                }
              />
            )}
            {projectSheet.mode === "rowActions" && (
              <div>
                <p
                  className="font-mono text-[10px] tracking-[3px] mb-4"
                  style={{ color: "#555" }}
                >
                  {projectSheet.project.name}
                </p>
                <button
                  onClick={() =>
                    setProjectSheet({ mode: "edit", project: projectSheet.project })
                  }
                  className="w-full btn-press font-mono text-[11px] tracking-[3px] mb-2"
                  style={{
                    height: 48,
                    color: "#F0F0F0",
                    background: "transparent",
                    border: "1px solid #2a2a2a",
                  }}
                >
                  EDIT
                </button>
                <button
                  onClick={() =>
                    setProjectSheet({ mode: "confirmRemove", project: projectSheet.project })
                  }
                  className="w-full btn-press font-mono text-[11px] tracking-[3px] mb-2"
                  style={{
                    height: 48,
                    color: "#FF4747",
                    background: "transparent",
                    border: "1px solid #2a2a2a",
                  }}
                >
                  REMOVE
                </button>
                <button
                  onClick={() => setProjectSheet(null)}
                  className="w-full btn-press font-mono text-[11px] tracking-[3px]"
                  style={{
                    height: 48,
                    color: "#555",
                    background: "transparent",
                    border: "none",
                  }}
                >
                  CANCEL
                </button>
              </div>
            )}
            {projectSheet.mode === "confirmRemove" && (
              <div>
                <p
                  className="font-impact mb-2"
                  style={{ fontSize: 20, color: "#F0F0F0", letterSpacing: "1px" }}
                >
                  REMOVE {projectSheet.project.name}?
                </p>
                <p className="font-mono text-[11px] mb-5" style={{ color: "#555" }}>
                  This deletes all its tasks.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProjectSheet(null)}
                    className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
                    style={{
                      height: 48,
                      color: "#F0F0F0",
                      background: "transparent",
                      border: "1px solid #2a2a2a",
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => deleteProject(projectSheet.project.id)}
                    className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
                    style={{
                      height: 48,
                      color: "#FF4747",
                      background: "transparent",
                      border: "1px solid #FF4747",
                    }}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Timeline({
  items,
  scope,
  today,
  now,
  projectColor,
  onToggle,
  onDelete,
}: {
  items: Task[];
  scope: Scope;
  today: string;
  now: string;
  projectColor: (key: string | null) => string;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const showDateHeaders = scope !== "TODAY";

  type Row = { kind: "header"; label: string } | { kind: "now" } | { kind: "task"; task: Task };
  const rows: Row[] = [];
  let lastDate: string | null = null;
  let nowMarkerInserted = false;
  const showNowMarker = scope === "TODAY";

  for (const t of items) {
    if (showDateHeaders && t.dueDate !== lastDate) {
      rows.push({ kind: "header", label: formatDueLabel(t.dueDate, today) });
      lastDate = t.dueDate;
    }
    if (
      showNowMarker &&
      !nowMarkerInserted &&
      t.dueDate === today &&
      t.dueTime &&
      t.dueTime > now
    ) {
      rows.push({ kind: "now" });
      nowMarkerInserted = true;
    }
    rows.push({ kind: "task", task: t });
  }
  if (showNowMarker && !nowMarkerInserted && items.some((t) => t.dueDate === today)) {
    rows.push({ kind: "now" });
  }

  return (
    <div style={{ padding: "16px 20px 8px 20px" }}>
      {rows.map((row, idx) => {
        if (row.kind === "header") {
          return (
            <div
              key={`h-${idx}`}
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                color: "#555",
                letterSpacing: "2.5px",
                marginTop: idx === 0 ? 0 : 16,
                marginBottom: 10,
              }}
            >
              {row.label}
            </div>
          );
        }
        if (row.kind === "now") {
          return (
            <div
              key={`now-${idx}`}
              className="flex items-center"
              style={{ minHeight: 28, marginBottom: 4 }}
            >
              <div
                className="font-mono"
                style={{
                  width: 56,
                  fontSize: 10,
                  color: "#E8FF47",
                  letterSpacing: "1.5px",
                }}
              >
                {now}
              </div>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: "#E8FF47",
                  border: "3px solid #080808",
                  boxShadow: "0 0 0 2px #E8FF47, 0 0 12px rgba(232,255,71,0.6)",
                  marginLeft: -3,
                  marginRight: 17,
                  flexShrink: 0,
                }}
              />
              <span
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  color: "#E8FF47",
                  letterSpacing: "2px",
                }}
              >
                NOW
              </span>
            </div>
          );
        }

        const t = row.task;
        const color = projectColor(t.projectKey);
        const overdue = t.dueDate < today && !t.completed;
        const lastReal = (() => {
          for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i].kind !== "header") return i;
          }
          return -1;
        })();
        const isLast = idx === lastReal;

        return (
          <div
            key={t.id}
            className="flex items-start"
            style={{ position: "relative", paddingBottom: 14, minHeight: 48 }}
          >
            {/* time column */}
            <div
              className="font-mono"
              style={{
                width: 56,
                fontSize: 10,
                color: overdue ? "#FF4778" : "#666",
                letterSpacing: "1px",
                paddingTop: 2,
                flexShrink: 0,
              }}
            >
              {t.dueTime ?? "—"}
            </div>

            {/* dot + line */}
            <div
              style={{
                position: "relative",
                width: 14,
                marginRight: 14,
                alignSelf: "stretch",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 6.5,
                  top: 14,
                  bottom: isLast ? 14 : -14,
                  width: 1,
                  background: "#1a1a1a",
                }}
              />
              <button
                onClick={() => onToggle(t.id, t.completed)}
                className="btn-press"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 4,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: t.completed ? color : "transparent",
                  border: `2px solid ${color}`,
                  padding: 0,
                  cursor: "pointer",
                  zIndex: 1,
                }}
              >
                {t.completed && (
                  <span
                    style={{
                      color: "#080808",
                      fontSize: 9,
                      lineHeight: 1,
                      fontWeight: 700,
                      display: "block",
                      marginTop: -1,
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            </div>

            {/* content */}
            <div className="flex-1 min-w-0">
              <p
                className="font-sans"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: t.completed ? "#444" : "#F0F0F0",
                  textDecoration: t.completed ? "line-through" : "none",
                  lineHeight: 1.3,
                }}
              >
                {t.title}
              </p>
              <div
                className="flex items-center gap-2 mt-1"
                style={{ fontSize: 9, color: "#555" }}
              >
                {t.projectKey && (
                  <span
                    className="font-mono uppercase"
                    style={{ color, letterSpacing: "1.5px" }}
                  >
                    {t.projectKey}
                  </span>
                )}
                {t.estimatedMinutes && (
                  <span
                    className="font-mono uppercase"
                    style={{ color: "#666", letterSpacing: "1.5px" }}
                  >
                    · {formatEstimate(t.estimatedMinutes)}
                  </span>
                )}
                {overdue && (
                  <span
                    className="font-mono uppercase"
                    style={{ color: "#FF4778", letterSpacing: "1.5px" }}
                  >
                    · LATE
                  </span>
                )}
                <button
                  onClick={() => onDelete(t.id)}
                  className="btn-press font-mono"
                  style={{
                    fontSize: 9,
                    color: "#333",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    marginLeft: "auto",
                    letterSpacing: "1.5px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectForm({
  title,
  submitLabel,
  initialName = "",
  initialStatus = "BUILDING",
  initialColor = "#E8FF47",
  onCancel,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initialName?: string;
  initialStatus?: string;
  initialColor?: string;
  onCancel: () => void;
  onSubmit: (name: string, status: string, color: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState(initialStatus);
  const [color, setColor] = useState(initialColor);

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[3px] mb-4" style={{ color: "#555" }}>
        {title}
      </p>

      <label className="font-mono text-[9px] tracking-[2px] block mb-1" style={{ color: "#555" }}>
        PROJECT NAME
      </label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ERP, OIC, R2·FIT..."
        className="w-full bg-transparent outline-none font-impact mb-5"
        style={{
          fontSize: 22,
          color: "#F0F0F0",
          borderBottom: "1px solid #2a2a2a",
          paddingBottom: 6,
          letterSpacing: "1px",
        }}
      />

      <label className="font-mono text-[9px] tracking-[2px] block mb-2" style={{ color: "#555" }}>
        STATUS
      </label>
      <div className="flex gap-2 mb-5">
        {STATUS_OPTIONS.map((s) => {
          const active = status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3"
              style={{
                height: 32,
                color: active ? "#080808" : "#555",
                background: active ? "#E8FF47" : "transparent",
                border: `1px solid ${active ? "#E8FF47" : "#2a2a2a"}`,
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      <label className="font-mono text-[9px] tracking-[2px] block mb-2" style={{ color: "#555" }}>
        COLOR
      </label>
      <div className="flex gap-3 mb-6">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="btn-press"
            style={{
              width: 32,
              height: 32,
              background: c,
              border: color === c ? "2px solid #F0F0F0" : "2px solid transparent",
            }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
          style={{
            height: 48,
            color: "#555",
            background: "transparent",
            border: "1px solid #2a2a2a",
          }}
        >
          CANCEL
        </button>
        <button
          onClick={() => name.trim() && onSubmit(name.trim(), status, color)}
          disabled={!name.trim()}
          className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
          style={{
            height: 48,
            color: name.trim() ? "#080808" : "#555",
            background: name.trim() ? "#E8FF47" : "transparent",
            border: `1px solid ${name.trim() ? "#E8FF47" : "#2a2a2a"}`,
          }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
