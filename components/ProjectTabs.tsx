"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { formatMilestoneDate } from "@/lib/date";

type Project = {
  id: string;
  name: string;
  color: string;
  streak: number;
  fullName: string;
  currentPhase: string;
  todayFocus: { id: string; task: string; completed: boolean } | null;
  history: { id: string; date: string; task: string; completed: boolean }[];
  milestones: { id: string; title: string; targetDate: string; completed: boolean }[];
  blockers: { id: string; description: string; reason: string; resolved: boolean; createdAt: string }[];
};

type Tab = "FOCUS" | "MILESTONES" | "BLOCKERS" | "HISTORY";

export function ProjectTabs({ project }: { project: Project }) {
  const [tab, setTab] = useState<Tab>("FOCUS");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <nav className="flex border-b border-border shrink-0 overflow-x-auto no-scrollbar">
        {(["FOCUS", "MILESTONES", "BLOCKERS", "HISTORY"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-5 py-3 text-[11px] font-mono tracking-widest whitespace-nowrap border-b-2 transition-colors",
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-accent-dim"
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto">
        {tab === "FOCUS" && <FocusTab project={project} />}
        {tab === "MILESTONES" && <MilestonesTab project={project} />}
        {tab === "BLOCKERS" && <BlockersTab project={project} />}
        {tab === "HISTORY" && <HistoryTab project={project} />}
      </div>
    </div>
  );
}

function FocusTab({ project }: { project: Project }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [taskText, setTaskText] = useState(project.todayFocus?.task ?? "");
  const [tomorrow, setTomorrow] = useState("");
  const done = project.todayFocus?.completed ?? false;

  function saveToday() {
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, task: taskText }),
      });
      setEditing(false);
      router.refresh();
    });
  }

  function markDone() {
    if (!project.todayFocus || done) return;
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.todayFocus!.id, completed: true }),
      });
      router.refresh();
    });
  }

  function saveTomorrow() {
    if (!tomorrow.trim()) return;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const date = d.toISOString().slice(0, 10);
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, task: tomorrow, date }),
      });
      setTomorrow("");
      router.refresh();
    });
  }

  return (
    <div className="p-5 space-y-6">
      <section>
        <p className="text-[10px] font-mono tracking-widest text-muted mb-2">TODAY</p>
        {editing ? (
          <div className="space-y-2">
            <input
              autoFocus
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-accent outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={saveToday}
                disabled={pending}
                className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-accent text-accent rounded hover:bg-accent hover:text-bg"
              >
                SAVE
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-border text-muted rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-lg text-text mb-3">
              {project.todayFocus?.task ?? "No task set."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-border text-accent-dim rounded hover:border-accent-dim"
              >
                EDIT TASK
              </button>
              <button
                onClick={markDone}
                disabled={done || pending || !project.todayFocus}
                className={clsx(
                  "text-[10px] font-mono tracking-widest px-3 py-1.5 border rounded",
                  done
                    ? "bg-done/15 border-done/40 text-done"
                    : "border-accent text-accent hover:bg-accent hover:text-bg"
                )}
              >
                {done ? "DONE ✓" : "MARK DONE ✓"}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="border-t border-border pt-5">
        <p className="text-[10px] font-mono tracking-widest text-muted mb-2">
          WHAT&apos;S THE ONE THING TOMORROW?
        </p>
        <div className="flex gap-2">
          <input
            value={tomorrow}
            onChange={(e) => setTomorrow(e.target.value)}
            placeholder="Tomorrow's focus..."
            className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm focus:border-accent outline-none"
          />
          <button
            onClick={saveTomorrow}
            disabled={pending || !tomorrow.trim()}
            className="text-[10px] font-mono tracking-widest px-3 py-2 border border-accent-dim text-accent-dim rounded hover:border-accent hover:text-accent"
          >
            SAVE
          </button>
        </div>
      </section>

      <section className="border-t border-border pt-5">
        <p className="text-[10px] font-mono tracking-widest text-muted mb-2">STREAK</p>
        <p className="font-display text-3xl tracking-wider">
          🔥 {project.streak} CONSECUTIVE DAY{project.streak === 1 ? "" : "S"}
        </p>
        <p className="text-[11px] font-mono text-accent-dim mt-1">{project.currentPhase}</p>
      </section>
    </div>
  );
}

function MilestonesTab({ project }: { project: Project }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  function add() {
    if (!title || !target) return;
    startTransition(async () => {
      await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, title, targetDate: target }),
      });
      setTitle("");
      setTarget("");
      setShowAdd(false);
      router.refresh();
    });
  }

  function toggle(id: string, completed: boolean) {
    startTransition(async () => {
      await fetch("/api/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      });
      router.refresh();
    });
  }

  return (
    <div className="p-5 space-y-4">
      <ul className="space-y-4">
        {project.milestones.map((m) => (
          <li key={m.id} className="border-l-2 pl-4" style={{ borderColor: project.color }}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggle(m.id, !m.completed)}
                className={clsx(
                  "text-sm text-left",
                  m.completed ? "text-muted line-through" : "text-text"
                )}
              >
                ● {m.title}
              </button>
              <span className="font-mono text-[11px] text-accent-dim">
                {formatMilestoneDate(m.targetDate)}
              </span>
            </div>
            <div className="mt-1 h-1 bg-surface2 rounded">
              <div
                className="h-full rounded"
                style={{
                  width: m.completed ? "100%" : "0%",
                  backgroundColor: project.color,
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      {showAdd ? (
        <div className="space-y-2 border-t border-border pt-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Milestone title"
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-accent outline-none"
          />
          <input
            type="date"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-accent outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={add}
              className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-accent text-accent rounded"
            >
              SAVE
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-border text-muted rounded"
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full text-[10px] font-mono tracking-widest py-3 border border-dashed border-border rounded text-accent-dim hover:border-accent-dim hover:text-accent"
        >
          + ADD MILESTONE
        </button>
      )}
    </div>
  );
}

function BlockersTab({ project }: { project: Project }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

  function add() {
    if (!description || !reason) return;
    startTransition(async () => {
      await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, description, reason }),
      });
      setDescription("");
      setReason("");
      setShowAdd(false);
      router.refresh();
    });
  }

  function resolve(id: string) {
    startTransition(async () => {
      await fetch("/api/blockers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved: true }),
      });
      router.refresh();
    });
  }

  const open = project.blockers.filter((b) => !b.resolved);

  return (
    <div className="p-5 space-y-4">
      {open.length === 0 && !showAdd && (
        <p className="text-center text-muted font-mono text-sm py-8">
          No blockers. Ship it. 💪
        </p>
      )}

      {project.blockers.map((b) => (
        <article
          key={b.id}
          className={clsx(
            "border rounded-lg p-4 bg-surface",
            b.resolved ? "border-border/40 opacity-60" : "border-stuck/40"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-stuck">🚫 BLOCKER</span>
            <span
              className={clsx(
                "text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full border",
                b.resolved
                  ? "border-done/40 text-done bg-done/10"
                  : "border-stuck/40 text-stuck bg-stuck/10"
              )}
            >
              {b.resolved ? "RESOLVED" : "OPEN"}
            </span>
          </div>
          <p className="text-sm mb-2">{b.description}</p>
          <p className="text-[11px] font-mono text-accent-dim leading-relaxed mb-3">
            <span className="text-muted">WHY: </span>
            {b.reason}
          </p>
          {!b.resolved && (
            <button
              onClick={() => resolve(b.id)}
              className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-accent-dim text-accent-dim rounded hover:bg-accent hover:text-bg hover:border-accent"
            >
              RESOLVED ✓
            </button>
          )}
        </article>
      ))}

      {showAdd ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-[10px] font-mono tracking-widest text-muted">WHAT&apos;S STUCK?</p>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-accent outline-none"
          />
          <p className="text-[10px] font-mono tracking-widest text-muted">
            WHY IS IT STUCK? (BE SPECIFIC)
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:border-accent outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={add}
              className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-accent text-accent rounded"
            >
              SAVE BLOCKER
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-border text-muted rounded"
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full text-[10px] font-mono tracking-widest py-3 border border-dashed border-stuck/40 rounded text-stuck/70 hover:border-stuck hover:text-stuck"
        >
          + FLAG BLOCKER
        </button>
      )}
    </div>
  );
}

function HistoryTab({ project }: { project: Project }) {
  return (
    <div className="p-5">
      <ul className="space-y-2">
        {project.history.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-3 py-2 border-b border-border/60"
          >
            <span
              className={clsx(
                "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0",
                f.completed
                  ? "bg-done/20 border-done/60 text-done"
                  : "border-muted text-muted"
              )}
            >
              {f.completed ? "✓" : "○"}
            </span>
            <span className="font-mono text-[10px] text-muted w-14 shrink-0">
              {formatMilestoneDate(f.date)}
            </span>
            <span
              className={clsx(
                "text-sm flex-1",
                f.completed ? "text-text" : "text-accent-dim"
              )}
            >
              {f.task}
            </span>
          </li>
        ))}
        {project.history.length === 0 && (
          <li className="text-center text-muted font-mono text-sm py-8">No history yet.</li>
        )}
      </ul>
    </div>
  );
}
