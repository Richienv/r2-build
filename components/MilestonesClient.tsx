"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { daysUntil, monthYear } from "@/lib/date";

type Milestone = {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  project: { id: string; name: string; color: string };
};

export function MilestonesClient({
  milestones,
  projects,
}: {
  milestones: Milestone[];
  projects: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? "");

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

  function add() {
    if (!title || !target || !selectedProject) return;
    startTransition(async () => {
      await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject, title, targetDate: target }),
      });
      setTitle("");
      setTarget("");
      setShowAdd(false);
      router.refresh();
    });
  }

  const open = milestones.filter((m) => !m.completed);
  const completed = milestones.filter((m) => m.completed);

  const grouped = open.reduce<Record<string, Milestone[]>>((acc, m) => {
    const key = monthYear(m.targetDate);
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <>
      <header className="shrink-0 flex items-center px-4"
        style={{ height: 56, borderBottom: "0.5px solid #2A2A2A" }}>
        <h1 className="font-impact text-[32px] leading-none tracking-wider" style={{ color: "#F0F0F0" }}>
          MILESTONES
        </h1>
      </header>

      <section className="flex-1 overflow-y-auto no-scrollbar">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <div className="px-4 py-2" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
              <span className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>{month}</span>
            </div>
            {items.map((m) => {
              const d = daysUntil(m.targetDate);
              const day = parseInt(m.targetDate.split("-")[2], 10);
              const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
              const mon = months[parseInt(m.targetDate.split("-")[1], 10) - 1];
              return (
                <button key={m.id} onClick={() => toggle(m.id, true)}
                  disabled={pending}
                  className="w-full flex items-center px-4 text-left btn-press"
                  style={{ height: 64, borderBottom: "0.5px solid #2A2A2A" }}>
                  <div className="shrink-0" style={{ width: 60 }}>
                    <p className="font-impact text-[20px] leading-none" style={{ color: "#F0F0F0" }}>{day}</p>
                    <p className="font-mono text-[9px] tracking-wider" style={{ color: "#444444" }}>{mon}</p>
                  </div>
                  <div className="flex-1 min-w-0 px-2">
                    <p className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>{m.project.name}</p>
                    <p className="font-impact text-[16px] tracking-wider truncate" style={{ color: "#F0F0F0" }}>
                      {m.title.toUpperCase()}
                    </p>
                  </div>
                  <span className="font-mono text-[9px] tracking-wider shrink-0" style={{ color: "#444444" }}>
                    {d > 0 ? `${d}D` : d === 0 ? "TODAY" : `${-d}D LATE`}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        {completed.length > 0 && (
          <div>
            <div className="px-4 py-2" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
              <span className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>COMPLETED</span>
            </div>
            {completed.map((m) => (
              <div key={m.id} className="flex items-center px-4"
                style={{ height: 52, borderBottom: "0.5px solid #2A2A2A", opacity: 0.3 }}>
                <span className="font-mono text-[9px] shrink-0" style={{ width: 60, color: "#444444" }}>
                  {m.targetDate.split("-")[2]} {["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][parseInt(m.targetDate.split("-")[1],10)-1]}
                </span>
                <span className="font-impact text-[14px] tracking-wider line-through flex-1" style={{ color: "#444444" }}>
                  {m.title.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add milestone */}
        {showAdd ? (
          <div className="p-4 space-y-3" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 font-mono text-[12px]"
              style={{ background: "#111111", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title"
              className="w-full px-3 py-2 font-mono text-[13px] placeholder-[#2A2A2A]"
              style={{ background: "#111111", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
            <input type="date" value={target} onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 font-mono text-[13px]"
              style={{ background: "#111111", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
            <div className="flex gap-2">
              <button onClick={add} disabled={pending}
                className="font-impact text-[14px] tracking-[3px] px-4 btn-press"
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
      </section>
    </>
  );
}
