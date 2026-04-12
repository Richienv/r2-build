"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "./StatusPill";
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
      <header className="shrink-0 px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${project.color}30` }}>
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="font-mono text-sm text-[#555] hover:text-white btn-press">←</Link>
          <StatusPill status={project.status as any} color={project.color} />
        </div>
        <h1 className="font-impact text-[48px] leading-none tracking-wider" style={{ color: project.color }}>
          {project.name}
        </h1>
      </header>

      <nav className="shrink-0 flex overflow-x-auto no-scrollbar" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        {(["FOCUS", "MILESTONES", "BLOCKERS", "LOG"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-3 font-mono text-[10px] tracking-[3px] whitespace-nowrap btn-press"
            style={{
              color: tab === t ? project.color : "#333",
              borderBottom: tab === t ? `2px solid ${project.color}` : "2px solid transparent",
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
    <div className="p-5 space-y-8">
      {/* Today's task */}
      <section>
        <p className="font-mono text-[10px] tracking-[3px] text-[#555] mb-3">TODAY&apos;S TASK</p>
        {editing ? (
          <div className="space-y-3">
            <input autoFocus value={taskText} onChange={(e) => setTaskText(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-lg"
              style={{ background: "#111", border: `1px solid ${project.color}`, color: "#F0F0F0" }} />
            <div className="flex gap-2">
              <button onClick={saveToday} disabled={pending}
                className="font-mono text-[10px] tracking-[3px] px-4 py-2 rounded btn-press"
                style={{ background: project.color, color: "#080808" }}>SAVE</button>
              <button onClick={() => setEditing(false)}
                className="font-mono text-[10px] tracking-[3px] px-4 py-2 rounded btn-press"
                style={{ border: "1px solid #2A2A2A", color: "#555" }}>CANCEL</button>
            </div>
          </div>
        ) : project.todayFocus ? (
          <>
            <p className={`font-impact leading-[0.88] mb-4 ${done ? "strike-anim relative" : ""}`}
              style={{ fontSize: "32px", color: done ? "#555" : project.color }}>
              {project.todayFocus.task.toUpperCase()}.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)}
                className="font-mono text-[10px] tracking-[3px] px-4 py-2 rounded btn-press"
                style={{ border: "1px solid #2A2A2A", color: "#555" }}>EDIT</button>
              <button onClick={markDone} disabled={done || pending}
                className="flex-1 h-[48px] rounded-lg font-impact text-[18px] tracking-[4px] btn-press transition-all"
                style={{
                  background: done ? "#47FFB8" : `${project.color}15`,
                  border: `1px solid ${done ? "#47FFB8" : project.color}66`,
                  color: done ? "#080808" : project.color,
                }}>
                {done ? "✓ DONE" : "MARK DONE ✓"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="font-impact text-[32px] leading-[0.9] text-white mb-4">
              WHAT&apos;S THE<br />ONE THING?
            </p>
            <button onClick={() => { setEditing(true); }}
              className="font-mono text-[10px] tracking-[3px] px-4 py-2 rounded btn-press"
              style={{ background: "#E8FF47", color: "#080808" }}>
              SET TODAY&apos;S TASK →
            </button>
          </div>
        )}
      </section>

      {/* Tomorrow */}
      <section style={{ borderTop: "0.5px solid #2A2A2A" }} className="pt-6">
        <p className="font-mono text-[10px] tracking-[3px] text-[#555] mb-3">SET TOMORROW&apos;S ONE THING:</p>
        <div className="flex gap-2">
          <input value={tomorrow} onChange={(e) => setTomorrow(e.target.value)}
            placeholder="What's the one thing tomorrow?"
            className="flex-1 rounded-lg px-4 py-3 text-sm placeholder-[#333]"
            style={{ background: "#111", border: `1px solid ${project.color}30`, color: "#F0F0F0" }} />
          <button onClick={saveTomorrow} disabled={pending || !tomorrow.trim()}
            className="font-mono text-[10px] tracking-[3px] px-4 py-3 rounded btn-press shrink-0"
            style={{ border: `1px solid ${project.color}40`, color: project.color }}>
            SAVE →
          </button>
        </div>
      </section>

      {/* Streak */}
      <section className="rounded-xl p-5" style={{ background: "#111", border: "0.5px solid #2A2A2A" }}>
        <p className="font-impact text-[28px] leading-none tracking-wider" style={{ color: project.color }}>
          🔥 {project.streak} CONSECUTIVE DAY{project.streak === 1 ? "" : "S"}
        </p>
        <div className="flex items-center gap-3 mt-4">
          {days.map((d, i) => {
            const entry = recentDays[i];
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] text-[#333]">{d}</span>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                  style={{
                    background: entry?.completed ? `${project.color}20` : "#1A1A1A",
                    border: `1px solid ${entry?.completed ? project.color : "#2A2A2A"}`,
                    color: entry?.completed ? project.color : "#333",
                  }}>
                  {entry?.completed ? "✓" : "○"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="font-mono text-[11px] text-[#333] mt-4 tracking-wider">Ship something every day.</p>
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

  const open = project.milestones.filter((m) => !m.completed);
  const completed = project.milestones.filter((m) => m.completed);

  return (
    <div className="p-5 space-y-4">
      {open.map((m) => {
        const d = daysUntil(m.targetDate);
        return (
          <div key={m.id} className="rounded-xl p-5" style={{ background: "#111", border: "0.5px solid #2A2A2A" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-impact text-[20px] tracking-wide text-white">{m.title.toUpperCase()}</p>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] text-[#555] tracking-wider">
                {formatMilestoneDate(m.targetDate)}, {m.targetDate.split("-")[0]}
              </span>
              <span className="font-mono text-[11px] tracking-wider"
                style={{ color: d <= 0 ? "#FF4747" : "#555" }}>
                {d > 0 ? `${d} DAYS` : d === 0 ? "TODAY" : `${-d} DAYS OVERDUE`}
              </span>
            </div>
            <div className="h-1 rounded-full mb-4" style={{ background: "#1A1A1A" }}>
              <div className="h-full rounded-full" style={{ width: "0%", background: project.color }} />
            </div>
            <button onClick={() => toggle(m.id, true)}
              className="font-mono text-[10px] tracking-[3px] px-3 py-1.5 rounded btn-press"
              style={{ border: `1px solid ${project.color}40`, color: project.color }}>
              MARK COMPLETE ✓
            </button>
          </div>
        );
      })}

      {completed.map((m) => (
        <div key={m.id} className="rounded-xl p-4 opacity-40" style={{ background: "#111", border: "0.5px solid #2A2A2A" }}>
          <p className="text-sm line-through text-[#555]">{m.title}</p>
          <span className="font-mono text-[10px] text-[#333]">{formatMilestoneDate(m.targetDate)}</span>
        </div>
      ))}

      {showAdd ? (
        <div className="space-y-3 pt-4" style={{ borderTop: "0.5px solid #2A2A2A" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title"
            className="w-full rounded-lg px-4 py-3 text-sm placeholder-[#333]"
            style={{ background: "#111", border: `1px solid ${project.color}30`, color: "#F0F0F0" }} />
          <input type="date" value={target} onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm"
            style={{ background: "#111", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <div className="flex gap-2">
            <button onClick={add}
              className="font-mono text-[10px] tracking-[3px] px-4 py-2 rounded btn-press"
              style={{ background: project.color, color: "#080808" }}>SAVE</button>
            <button onClick={() => setShowAdd(false)}
              className="font-mono text-[10px] tracking-[3px] px-4 py-2 rounded btn-press"
              style={{ border: "1px solid #2A2A2A", color: "#555" }}>CANCEL</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full font-mono text-[10px] tracking-[3px] py-4 rounded-xl btn-press"
          style={{ border: "1px dashed #2A2A2A", color: "#555" }}>
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
        <div className="py-12 text-center">
          <p className="font-impact text-[48px] leading-[0.85] text-white">NOTHING<br />BLOCKING.</p>
          <p className="text-sm text-[#555] mt-3">Ship it. 💪</p>
        </div>
      )}

      {project.blockers.map((b) => (
        <div key={b.id} className="rounded-xl p-5"
          style={{
            background: "#111",
            border: `0.5px solid ${b.resolved ? "#2A2A2A" : "#FF474740"}`,
            opacity: b.resolved ? 0.4 : 1,
          }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] tracking-[3px] text-stuck">🚫 {b.resolved ? "RESOLVED" : "OPEN"}</span>
          </div>
          <p className={`text-sm mb-2 ${b.resolved ? "line-through text-[#555]" : "text-white"}`}>{b.description}</p>
          <p className="font-mono text-[11px] text-[#555] leading-relaxed mb-3">
            <span className="text-[#333]">WHY: </span>{b.reason}
          </p>
          {!b.resolved && (
            <button onClick={() => resolve(b.id)}
              className="font-mono text-[10px] tracking-[3px] px-3 py-1.5 rounded btn-press"
              style={{ border: "1px solid #555", color: "#555" }}>
              RESOLVED ✓
            </button>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="space-y-3 pt-4" style={{ borderTop: "0.5px solid #2A2A2A" }}>
          <p className="font-impact text-[24px] tracking-wider text-stuck">WHAT&apos;S STUCK?</p>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm placeholder-[#333]"
            style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <p className="font-impact text-[24px] tracking-wider text-white">WHY?</p>
          <p className="font-mono text-[10px] tracking-[2px] text-[#555]">BE SPECIFIC. THIS FORCES YOU TO THINK.</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            className="w-full rounded-lg px-4 py-3 text-sm placeholder-[#333] resize-none"
            style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
          <button onClick={addBlocker}
            className="w-full h-[48px] rounded-lg font-impact text-[18px] tracking-[4px] btn-press"
            style={{ background: "#FF4747", color: "#080808" }}>SAVE BLOCKER</button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full font-mono text-[10px] tracking-[3px] py-4 rounded-xl btn-press"
          style={{ border: "1px dashed #FF474740", color: "#FF474780" }}>
          + FLAG BLOCKER
        </button>
      )}
    </div>
  );
}

function LogTab({ project }: { project: Project }) {
  return (
    <div className="p-5">
      {project.history.map((f) => (
        <div key={f.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "0.5px solid #1A1A1A" }}>
          <span className="font-mono text-[11px] text-[#555] w-14 shrink-0">
            {formatMilestoneDate(f.date)}
          </span>
          <span className={`text-sm flex-1 ${f.completed ? "text-white" : "text-[#333]"}`}>
            {f.task}
          </span>
          <span className="text-xs" style={{ color: f.completed ? "#47FFB8" : "#333" }}>
            {f.completed ? "✓" : "○"}
          </span>
        </div>
      ))}
      {project.history.length === 0 && (
        <p className="text-center text-[#555] font-mono text-xs tracking-[3px] py-12">NO HISTORY YET.</p>
      )}
    </div>
  );
}
