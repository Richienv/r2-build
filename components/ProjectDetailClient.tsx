"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMilestoneDate, daysUntil } from "@/lib/date";

type Project = {
  id: string;
  name: string;
  fullName: string;
  color: string;
  streak: number;
  status: string;
  currentPhase: string;
  todayFocus: { id: string; task: string; completed: boolean } | null;
  history: { id: string; date: string; task: string; completed: boolean }[];
  milestones: { id: string; title: string; targetDate: string; completed: boolean }[];
  blockers: { id: string; description: string; reason: string; resolved: boolean; createdAt: string }[];
};

type Tab = "FOCUS" | "MILESTONES" | "BLOCKERS" | "LOG";

export function ProjectDetailClient({ project }: { project: Project }) {
  const [tab, setTab] = useState<Tab>("FOCUS");

  return (
    <>
      {/* Header */}
      <header className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="font-mono text-[12px] btn-press" style={{ color: "#444444" }}>←</Link>
          <span className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>{project.status}</span>
        </div>
        <h1 className="font-impact text-[48px] leading-none tracking-wider" style={{ color: "#F0F0F0" }}>
          {project.name}
        </h1>
      </header>

      {/* Tabs */}
      <nav className="shrink-0 flex" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        {(["FOCUS", "MILESTONES", "BLOCKERS", "LOG"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-3 font-mono text-[9px] tracking-[3px] btn-press"
            style={{
              color: tab === t ? "#F0F0F0" : "#444444",
              borderBottom: tab === t ? "1px solid #F0F0F0" : "1px solid transparent",
            }}>
            {t}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {tab === "FOCUS" && <FocusTab project={project} />}
        {tab === "MILESTONES" && <MilestonesTab project={project} />}
        {tab === "BLOCKERS" && <BlockersTab project={project} />}
        {tab === "LOG" && <LogTab project={project} />}
      </div>
    </>
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
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, task: tomorrow, date: d.toISOString().slice(0, 10) }),
      });
      setTomorrow("");
      router.refresh();
    });
  }

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const recentDays = project.history.slice(0, 7).reverse();

  return (
    <div className="p-4 space-y-6">
      {/* Today's task */}
      <section>
        <p className="font-mono text-[8px] tracking-[3px] mb-2" style={{ color: "#444444" }}>TODAY&apos;S TASK</p>
        {editing ? (
          <div className="space-y-3">
            <input autoFocus value={taskText} onChange={(e) => setTaskText(e.target.value)}
              className="w-full px-3 py-3 font-mono text-[14px]"
              style={{ background: "#111", border: "0.5px solid #F0F0F0", color: "#F0F0F0" }} />
            <div className="flex gap-2">
              <button onClick={saveToday} disabled={pending}
                className="font-impact text-[14px] tracking-[3px] px-4 btn-press"
                style={{ height: 40, background: "#F0F0F0", color: "#080808" }}>SAVE</button>
              <button onClick={() => setEditing(false)}
                className="font-impact text-[14px] tracking-[3px] px-4 btn-press"
                style={{ height: 40, border: "0.5px solid #2A2A2A", color: "#444444" }}>CANCEL</button>
            </div>
          </div>
        ) : project.todayFocus ? (
          <>
            <p className={`font-impact leading-[0.95] mb-4 ${done ? "strike-anim" : ""}`}
              style={{ fontSize: 28, color: done ? "#444444" : "#F0F0F0" }}>
              {project.todayFocus.task.toUpperCase()}.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)}
                className="font-mono text-[9px] tracking-[3px] px-3 btn-press"
                style={{ height: 40, border: "0.5px solid #2A2A2A", color: "#444444" }}>EDIT</button>
              <button onClick={markDone} disabled={done || pending}
                className="flex-1 font-impact text-[16px] tracking-[4px] btn-press"
                style={{
                  height: 48,
                  background: done ? "#F0F0F010" : "transparent",
                  border: "0.5px solid #2A2A2A",
                  color: done ? "#F0F0F030" : "#444444",
                }}>
                {done ? "✓ DONE" : "DONE ✓"}
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="font-impact text-[28px] leading-[0.95]" style={{ color: "#F0F0F0" }}>
              WHAT&apos;S THE<br />ONE THING?
            </p>
            <button onClick={() => setEditing(true)}
              className="font-impact text-[14px] tracking-[3px] mt-4 px-4 btn-press"
              style={{ height: 48, background: "#F0F0F0", color: "#080808" }}>
              SET TASK →
            </button>
          </div>
        )}
      </section>

      {/* Tomorrow */}
      <section style={{ borderTop: "0.5px solid #2A2A2A" }} className="pt-4">
        <p className="font-mono text-[8px] tracking-[3px] mb-2" style={{ color: "#444444" }}>
          TOMORROW&apos;S ONE THING:
        </p>
        <div className="flex gap-2">
          <input value={tomorrow} onChange={(e) => setTomorrow(e.target.value)}
            placeholder="What's the one thing tomorrow?"
            className="flex-1 px-3 py-3 font-mono text-[13px] placeholder-[#2A2A2A]"
            style={{ background: "#111", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <button onClick={saveTomorrow} disabled={pending || !tomorrow.trim()}
            className="font-impact text-[12px] tracking-[3px] px-3 shrink-0 btn-press"
            style={{ height: 44, border: "0.5px solid #2A2A2A", color: "#444444" }}>SAVE</button>
        </div>
      </section>

      {/* Streak */}
      <section style={{ borderTop: "0.5px solid #2A2A2A" }} className="pt-4">
        <p className="font-impact text-[24px] tracking-wider mb-4"
          style={{ color: project.streak > 0 ? "#F0F0F0" : "#444444" }}>
          🔥 {project.streak} CONSECUTIVE DAY{project.streak === 1 ? "" : "S"}
        </p>
        <div className="flex items-center gap-3">
          {days.map((d, i) => {
            const entry = recentDays[i];
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="font-mono text-[9px]" style={{ color: "#444444" }}>{d}</span>
                <span className="w-6 h-6 flex items-center justify-center font-mono text-[9px]"
                  style={{
                    border: `0.5px solid ${entry?.completed ? "#F0F0F0" : "#2A2A2A"}`,
                    color: entry?.completed ? "#F0F0F0" : "#2A2A2A",
                    background: entry?.completed ? "#F0F0F010" : "transparent",
                  }}>
                  {entry?.completed ? "✓" : "○"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="font-mono text-[9px] tracking-[3px] mt-4" style={{ color: "#444444" }}>
          SHIP SOMETHING EVERY DAY.
        </p>
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
      setTitle(""); setTarget(""); setShowAdd(false);
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
    <div>
      {project.milestones.map((m) => {
        const d = daysUntil(m.targetDate);
        return (
          <div key={m.id} className="flex items-center px-4"
            style={{
              height: 64,
              borderBottom: "0.5px solid #2A2A2A",
              opacity: m.completed ? 0.3 : 1,
            }}>
            <div className="flex-1 min-w-0">
              <p className={`font-impact text-[16px] tracking-wider ${m.completed ? "line-through" : ""}`}
                style={{ color: m.completed ? "#444444" : "#F0F0F0" }}>
                {m.title.toUpperCase()}
              </p>
              <p className="font-mono text-[9px] tracking-wider" style={{ color: "#444444" }}>
                {formatMilestoneDate(m.targetDate)} · {d > 0 ? `${d}D` : d === 0 ? "TODAY" : `${-d}D LATE`}
              </p>
            </div>
            {!m.completed && (
              <button onClick={() => toggle(m.id, true)}
                className="font-mono text-[9px] tracking-[3px] px-2 shrink-0 btn-press"
                style={{ height: 32, border: "0.5px solid #2A2A2A", color: "#444444" }}>
                ✓
              </button>
            )}
          </div>
        );
      })}
      {showAdd ? (
        <div className="p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title"
            className="w-full px-3 py-2 font-mono text-[13px] placeholder-[#2A2A2A]"
            style={{ background: "#111", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <input type="date" value={target} onChange={(e) => setTarget(e.target.value)}
            className="w-full px-3 py-2 font-mono text-[13px]"
            style={{ background: "#111", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <div className="flex gap-2">
            <button onClick={add} className="font-impact text-[14px] tracking-[3px] px-4 btn-press"
              style={{ height: 40, background: "#F0F0F0", color: "#080808" }}>SAVE</button>
            <button onClick={() => setShowAdd(false)}
              className="font-impact text-[14px] tracking-[3px] px-4 btn-press"
              style={{ height: 40, border: "0.5px solid #2A2A2A", color: "#444444" }}>CANCEL</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full font-impact text-[14px] tracking-[3px] btn-press"
          style={{ height: 48, border: "0.5px solid #2A2A2A", color: "#444444" }}>
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

  function addBlocker() {
    if (!description || !reason) return;
    startTransition(async () => {
      await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, description, reason }),
      });
      setDescription(""); setReason(""); setShowAdd(false);
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
    <div>
      {open.length === 0 && !showAdd && (
        <div className="py-16 text-center">
          <p className="font-impact text-[48px] leading-[0.9]" style={{ color: "#F0F0F0" }}>
            NOTHING<br />BLOCKING.
          </p>
          <p className="font-mono text-[12px] mt-3" style={{ color: "#444444" }}>Ship it.</p>
        </div>
      )}

      {project.blockers.map((b) => (
        <div key={b.id} className="px-4 py-4"
          style={{
            background: "#111",
            borderBottom: "1px solid #080808",
            borderLeft: b.resolved ? "none" : "3px solid #F0F0F0",
            opacity: b.resolved ? 0.3 : 1,
          }}>
          <p className="font-mono text-[8px] tracking-[3px] mb-1" style={{ color: "#444444" }}>WHAT:</p>
          <p className={`font-impact text-[18px] tracking-wider mb-3 ${b.resolved ? "line-through" : ""}`}
            style={{ color: b.resolved ? "#444444" : "#F0F0F0" }}>
            {b.description.toUpperCase()}
          </p>
          <p className="font-mono text-[8px] tracking-[3px] mb-1" style={{ color: "#444444" }}>WHY:</p>
          <p className="font-mono text-[12px] leading-relaxed mb-3" style={{ color: "#F0F0F060" }}>{b.reason}</p>
          {!b.resolved && (
            <button onClick={() => resolve(b.id)}
              className="font-mono text-[10px] tracking-[3px] px-3 btn-press"
              style={{ height: 32, border: "0.5px solid #2A2A2A", color: "#444444" }}>
              RESOLVED ✓
            </button>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="p-4 space-y-3">
          <p className="font-impact text-[20px] tracking-wider" style={{ color: "#F0F0F0" }}>WHAT&apos;S STUCK?</p>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-3 font-mono text-[13px] placeholder-[#2A2A2A]"
            style={{ background: "#080808", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <p className="font-impact text-[20px] tracking-wider" style={{ color: "#F0F0F0" }}>WHY?</p>
          <p className="font-mono text-[9px] tracking-[2px]" style={{ color: "#444444" }}>BE SPECIFIC. FORCES YOU TO THINK.</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            className="w-full px-3 py-3 font-mono text-[13px] placeholder-[#2A2A2A] resize-none"
            style={{ background: "#080808", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <button onClick={addBlocker}
            className="w-full font-impact text-[18px] tracking-[4px] btn-press"
            style={{ height: 52, background: "#F0F0F0", color: "#080808" }}>SAVE BLOCKER</button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full font-impact text-[14px] tracking-[3px] btn-press"
          style={{ height: 48, border: "1px dashed #2A2A2A", color: "#444444" }}>
          + FLAG BLOCKER
        </button>
      )}
    </div>
  );
}

function LogTab({ project }: { project: Project }) {
  return (
    <div>
      {project.history.map((f) => (
        <div key={f.id} className="flex items-center px-4"
          style={{ height: 48, borderBottom: "0.5px solid #2A2A2A" }}>
          <span className="font-mono text-[9px] tracking-wider shrink-0" style={{ width: 56, color: "#444444" }}>
            {formatMilestoneDate(f.date)}
          </span>
          <span className="font-mono text-[13px] flex-1 truncate px-2"
            style={{ color: f.completed ? "#F0F0F0" : "#444444" }}>
            {f.task}
          </span>
          <span className="shrink-0 w-4 h-4 flex items-center justify-center font-mono text-[9px]"
            style={f.completed ? { background: "#F0F0F0", color: "#080808", borderRadius: "50%" } : { border: "1px solid #2A2A2A", borderRadius: "50%" }}>
            {f.completed ? "✓" : ""}
          </span>
        </div>
      ))}
      {project.history.length === 0 && (
        <p className="text-center font-mono text-[9px] tracking-[3px] py-16" style={{ color: "#444444" }}>
          NO HISTORY YET.
        </p>
      )}
    </div>
  );
}
