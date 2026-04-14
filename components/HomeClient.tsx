"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  status: string;
  color: string;
  focus: { id: string; task: string; completed: boolean } | null;
  weekDone: number;
  weekTotal: number;
};

const STATUS_OPTIONS = ["BUILDING", "PAUSED", "SHIPPED"] as const;
const STATUS_TO_DB: Record<string, string> = {
  BUILDING: "BUILDING",
  PAUSED: "PAUSED",
  SHIPPED: "DONE",
};
const DB_TO_STATUS: Record<string, string> = {
  BUILDING: "BUILDING",
  PAUSED: "PAUSED",
  DONE: "SHIPPED",
  STUCK: "BUILDING",
  WAITING: "PAUSED",
};
const COLOR_PRESETS = ["#E8FF47", "#47A3FF", "#FF4778", "#47FFB0", "#F7931A", "#7B2FBE"];

function getDateStr(): string {
  const now = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

export function HomeClient({
  projects,
  maxStreak,
}: {
  projects: Project[];
  maxStreak: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dateStr, setDateStr] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState("");
  const [sheet, setSheet] = useState<
    | null
    | { mode: "add" }
    | { mode: "edit"; project: Project }
    | { mode: "confirmRemove"; project: Project }
    | { mode: "rowActions"; project: Project }
  >(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  useEffect(() => {
    setDateStr(getDateStr());
  }, []);

  const withFocus = projects.filter((p) => p.focus);
  const doneCount = withFocus.filter((p) => p.focus!.completed).length;
  const totalCount = projects.length;

  function startLongPress(project: Project) {
    longPressedRef.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(20);
      setSheet({ mode: "rowActions", project });
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function onRowTap(project: Project) {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    setEditingRow(project.id);
    setTaskDraft(project.focus?.task ?? "");
  }

  function saveTask(projectId: string) {
    const task = taskDraft.trim();
    if (!task) {
      setEditingRow(null);
      return;
    }
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, task }),
      });
      setEditingRow(null);
      setTaskDraft("");
      router.refresh();
    });
  }

  async function createProject(name: string, status: string, color: string) {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status: STATUS_TO_DB[status], color }),
    });
    setSheet(null);
    router.refresh();
  }

  async function editProject(id: string, name: string, status: string, color: string) {
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, status: STATUS_TO_DB[status], color }),
    });
    setSheet(null);
    router.refresh();
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    setSheet(null);
    router.refresh();
  }

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
          <span
            className="font-mono text-[9px] tracking-wider"
            style={{ color: "#444" }}
          >
            {maxStreak}D STREAK
          </span>
          {projects.length < 6 && (
            <button
              onClick={() => setSheet({ mode: "add" })}
              className="btn-press font-mono text-[10px] tracking-wider"
              style={{ color: "#E8FF47", background: "transparent", border: "none" }}
            >
              + PROJECT
            </button>
          )}
        </div>
      </header>

      {/* Score hero */}
      <section
        className="shrink-0 flex flex-col items-center justify-center px-5"
        style={{ paddingTop: 24, paddingBottom: 20, borderBottom: "0.5px solid #1a1a1a" }}
      >
        <p className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444" }}>
          {dateStr || "\u00A0"}
        </p>
        <p
          className="font-impact leading-none"
          style={{ fontSize: 68, color: "#E8FF47", marginTop: 6 }}
        >
          {doneCount}/{totalCount}
        </p>
        <p className="font-mono text-[10px] tracking-[3px]" style={{ color: "#555", marginTop: 4 }}>
          DONE
        </p>
      </section>

      {/* Project rows */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <p
              className="font-mono text-[10px] tracking-[3px] text-center"
              style={{ color: "#444" }}
            >
              NO PROJECTS YET
            </p>
            <button
              onClick={() => setSheet({ mode: "add" })}
              className="btn-press font-mono text-[10px] tracking-[3px] mt-4 px-4"
              style={{
                height: 36,
                color: "#080808",
                background: "#E8FF47",
                border: "none",
              }}
            >
              + ADD PROJECT
            </button>
          </div>
        ) : (
          projects.map((p) => {
            const isEditing = editingRow === p.id;
            const done = p.focus?.completed;
            const weekPct =
              p.weekTotal > 0 ? (p.weekDone / p.weekTotal) * 100 : 0;
            return (
              <div
                key={p.id}
                onPointerDown={() => startLongPress(p)}
                onPointerUp={() => {
                  cancelLongPress();
                  if (!longPressedRef.current && !isEditing) onRowTap(p);
                }}
                onPointerLeave={cancelLongPress}
                onPointerCancel={cancelLongPress}
                className="btn-press px-5"
                style={{
                  minHeight: 88,
                  borderBottom: "0.5px solid #1a1a1a",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: "pointer",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  paddingTop: 14,
                  paddingBottom: 14,
                }}
              >
                {/* Top row: name + status */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono uppercase"
                    style={{
                      fontSize: 11,
                      color: "#555",
                      letterSpacing: "2px",
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="font-mono uppercase"
                    style={{
                      fontSize: 9,
                      color: done ? "#E8FF47" : "#444",
                      letterSpacing: "2px",
                    }}
                  >
                    {done ? "✓ DONE" : "NO TASK"}
                  </span>
                </div>

                {/* Middle: focus task */}
                <div style={{ marginTop: 6, marginBottom: 10 }}>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={taskDraft}
                      onChange={(e) => setTaskDraft(e.target.value)}
                      onBlur={() => saveTask(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTask(p.id);
                        if (e.key === "Escape") setEditingRow(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder="What's the one thing?"
                      className="w-full bg-transparent outline-none font-sans"
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#F0F0F0",
                      }}
                    />
                  ) : p.focus ? (
                    <p
                      className="truncate font-sans"
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: done ? "#444" : "#F0F0F0",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {p.focus.task}
                    </p>
                  ) : (
                    <p
                      className="font-mono uppercase"
                      style={{
                        fontSize: 11,
                        color: "#333",
                        letterSpacing: "1.5px",
                      }}
                    >
                      TAP TO SET TODAY&apos;S FOCUS →
                    </p>
                  )}
                </div>

                {/* Bottom: weekly progress bar */}
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: "#222",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${weekPct}%`,
                        height: "100%",
                        background: "#E8FF47",
                        transition: "width 300ms ease",
                      }}
                    />
                  </div>
                  <span
                    className="font-mono uppercase"
                    style={{
                      fontSize: 9,
                      color: "#555",
                      letterSpacing: "1.5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.weekDone}/{p.weekTotal} TASKS THIS WEEK
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom sheet */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSheet(null)}
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
            {sheet.mode === "add" && (
              <ProjectForm
                title="NEW PROJECT"
                submitLabel="ADD PROJECT"
                onCancel={() => setSheet(null)}
                onSubmit={(name, status, color) => createProject(name, status, color)}
              />
            )}
            {sheet.mode === "edit" && (
              <ProjectForm
                title="EDIT PROJECT"
                submitLabel="SAVE"
                initialName={sheet.project.name}
                initialStatus={DB_TO_STATUS[sheet.project.status] ?? "BUILDING"}
                initialColor={sheet.project.color}
                onCancel={() => setSheet(null)}
                onSubmit={(name, status, color) =>
                  editProject(sheet.project.id, name, status, color)
                }
              />
            )}
            {sheet.mode === "rowActions" && (
              <div>
                <p className="font-mono text-[10px] tracking-[3px] mb-4" style={{ color: "#555" }}>
                  {sheet.project.name}
                </p>
                <button
                  onClick={() => setSheet({ mode: "edit", project: sheet.project })}
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
                  onClick={() => setSheet({ mode: "confirmRemove", project: sheet.project })}
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
                  onClick={() => setSheet(null)}
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
            {sheet.mode === "confirmRemove" && (
              <div>
                <p className="font-impact mb-2" style={{ fontSize: 20, color: "#F0F0F0", letterSpacing: "1px" }}>
                  REMOVE {sheet.project.name}?
                </p>
                <p className="font-mono text-[11px] mb-5" style={{ color: "#555" }}>
                  This deletes all its tasks.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSheet(null)}
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
                    onClick={() => deleteProject(sheet.project.id)}
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
