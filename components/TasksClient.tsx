"use client";

import { useMemo, useState, useTransition } from "react";
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

type ProjectOpt = { name: string; color: string };

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

export function TasksClient({
  tasks,
  projects,
  today,
}: {
  tasks: Task[];
  projects: ProjectOpt[];
  today: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return tasks;
    return tasks.filter((t) => t.projectKey === filter);
  }, [tasks, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of filtered) {
      const key = t.projectKey ?? "OTHER";
      (map[key] ??= []).push(t);
    }
    return map;
  }, [filtered]);

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
    setShowAdd(false);
    router.refresh();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    router.refresh();
  }

  const projectColor = (key: string | null) => {
    if (!key) return "#444";
    return projects.find((p) => p.name === key)?.color ?? "#444";
  };

  return (
    <>
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 56, borderBottom: "0.5px solid #222" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-[14px] btn-press"
            style={{ color: "#444" }}
          >
            ←
          </Link>
          <span className="font-impact" style={{ fontSize: 28, color: "#F0F0F0", letterSpacing: "1px" }}>
            TASKS
          </span>
        </div>
        <span
          className="font-mono text-[9px] tracking-[2px]"
          style={{ color: "#444" }}
        >
          {tasks.filter((t) => t.completed).length}/{tasks.length} DONE
        </span>
      </header>

      {/* Filter pills */}
      <div
        className="shrink-0 flex items-center gap-2 px-5 overflow-x-auto no-scrollbar"
        style={{ height: 44, borderBottom: "0.5px solid #1a1a1a" }}
      >
        {["ALL", ...projects.map((p) => p.name)].map((label) => {
          const active = filter === label;
          return (
            <button
              key={label}
              onClick={() => setFilter(label)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3 shrink-0"
              style={{
                height: 26,
                color: active ? "#080808" : "#555",
                background: active ? "#E8FF47" : "transparent",
                border: `1px solid ${active ? "#E8FF47" : "#2a2a2a"}`,
                borderRadius: 0,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Task list grouped by project */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 120 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <p
              className="font-mono text-[10px] tracking-[3px] text-center"
              style={{ color: "#444" }}
            >
              NO TASKS YET
            </p>
            <p
              className="font-mono text-[9px] tracking-[2px] text-center mt-2"
              style={{ color: "#333" }}
            >
              TAP + TO ADD
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([projectKey, list]) => {
            const color = projectColor(projectKey === "OTHER" ? null : projectKey);
            return (
              <div key={projectKey}>
                <div
                  className="flex items-center gap-2 px-5"
                  style={{
                    height: 36,
                    background: "#0c0c0c",
                    borderBottom: "0.5px solid #1a1a1a",
                    borderTop: "0.5px solid #1a1a1a",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: color,
                    }}
                  />
                  <span
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      color: "#555",
                      letterSpacing: "2.5px",
                    }}
                  >
                    {projectKey}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 9,
                      color: "#333",
                      letterSpacing: "2px",
                      marginLeft: "auto",
                    }}
                  >
                    {list.filter((t) => t.completed).length}/{list.length}
                  </span>
                </div>
                {list.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    today={today}
                    onToggle={() => toggleTask(t.id, t.completed)}
                    onDelete={() => setConfirmDelete(t.id)}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="btn-press"
        style={{
          position: "fixed",
          right: 20,
          bottom: 88,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "#E8FF47",
          color: "#080808",
          fontSize: 28,
          fontWeight: 700,
          border: "none",
          boxShadow: "0 4px 20px rgba(232,255,71,0.4)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          paddingBottom: 4,
        }}
      >
        +
      </button>

      {/* Add task sheet */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAdd(false)}
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
              projects={projects}
              today={today}
              defaultProject={filter !== "ALL" ? filter : undefined}
              onCancel={() => setShowAdd(false)}
              onSubmit={createTask}
            />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setConfirmDelete(null)}
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
                onClick={() => setConfirmDelete(null)}
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
                onClick={() => deleteTask(confirmDelete)}
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
    </>
  );
}

function TaskRow({
  task,
  today,
  onToggle,
  onDelete,
}: {
  task: Task;
  today: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const due = formatDueLabel(task.dueDate, today);
  const late = task.dueDate < today && !task.completed;
  const estimate = formatEstimate(task.estimatedMinutes);

  return (
    <div
      className="flex items-center px-5"
      style={{
        minHeight: 56,
        borderBottom: "0.5px solid #151515",
        gap: 12,
      }}
    >
      <button
        onClick={onToggle}
        className="btn-press shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: task.completed ? "#E8FF47" : "transparent",
          border: `1.5px solid ${task.completed ? "#E8FF47" : "#333"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        {task.completed && (
          <span
            style={{
              color: "#080808",
              fontSize: 12,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="font-sans truncate"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: task.completed ? "#444" : "#F0F0F0",
            textDecoration: task.completed ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.dueTime && (
            <span
              className="font-mono"
              style={{
                fontSize: 9,
                color: "#666",
                letterSpacing: "1px",
              }}
            >
              {task.dueTime}
            </span>
          )}
          {estimate && (
            <span
              className="font-mono"
              style={{
                fontSize: 9,
                color: "#444",
                letterSpacing: "1.5px",
              }}
            >
              {estimate}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            color: late ? "#FF4778" : "#555",
            letterSpacing: "1.5px",
          }}
        >
          {due}
        </span>
        <button
          onClick={onDelete}
          className="btn-press font-mono"
          style={{
            fontSize: 10,
            color: "#333",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
