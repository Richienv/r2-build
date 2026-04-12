"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Blocker = {
  id: string;
  description: string;
  reason: string;
  resolved: boolean;
  createdAt: string;
  project: { id: string; name: string; color: string };
};

type Props = {
  blockers: Blocker[];
  projects: { id: string; name: string; color: string }[];
  hasOpenBlockers: boolean;
};

export function BlockersClient({ blockers, projects, hasOpenBlockers }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

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

  function addBlocker() {
    if (!description || !reason || !selectedProject) return;
    startTransition(async () => {
      await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject, description, reason }),
      });
      setDescription("");
      setReason("");
      setShowAdd(false);
      router.refresh();
    });
  }

  const open = blockers.filter((b) => !b.resolved);
  const resolved = blockers.filter((b) => b.resolved);

  const grouped = open.reduce<Record<string, Blocker[]>>((acc, b) => {
    (acc[b.project.name] ??= []).push(b);
    return acc;
  }, {});

  return (
    <>
      <header className="shrink-0 px-5 pt-6 pb-4 flex items-start justify-between"
        style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-impact text-[42px] leading-none tracking-wider text-white">BLOCKERS</h1>
            {hasOpenBlockers && <span className="w-2 h-2 rounded-full bg-stuck mt-2" />}
          </div>
          <p className="font-mono text-[10px] tracking-[3px] text-[#555] mt-2">
            {open.length} OPEN
          </p>
        </div>
      </header>

      {!hasOpenBlockers && !showAdd ? (
        <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-impact text-[64px] leading-[0.85] text-white">
            NOTHING<br />BLOCKING<br />YOU.
          </p>
          <p className="text-sm text-[#555] mt-4">Ship something today.</p>
          <button onClick={() => setShowAdd(true)}
            className="font-mono text-[10px] tracking-[3px] px-4 py-2 mt-6 rounded btn-press"
            style={{ border: "1px dashed #FF474740", color: "#FF4747" }}>
            + FLAG BLOCKER
          </button>
        </section>
      ) : (
        <section className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {Object.entries(grouped).map(([projectName, items]) => (
            <div key={projectName}>
              <p className="font-mono text-[10px] tracking-[3px] text-[#555] mb-3 px-1">
                {projectName} BLOCKERS
              </p>
              {items.map((b) => (
                <div key={b.id} className="rounded-xl p-5 mb-3"
                  style={{ background: "#111111", border: "0.5px solid #FF474740" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] tracking-[3px] text-stuck">
                      🚫 OPEN BLOCKER
                    </span>
                    <span className="font-mono text-[10px] tracking-[3px] px-2 py-0.5 rounded-full"
                      style={{ background: "#FF474715", border: "1px solid #FF474740", color: "#FF4747" }}>
                      OPEN
                    </span>
                  </div>
                  <p className="text-sm text-white mb-3">{b.description}</p>
                  <p className="font-mono text-[11px] text-[#555] leading-relaxed mb-4">
                    <span className="text-[#333]">WHY: </span>{b.reason}
                  </p>
                  <div className="flex items-center justify-between">
                    <button onClick={() => resolve(b.id)}
                      className="font-mono text-[10px] tracking-[3px] px-3 py-1.5 rounded btn-press"
                      style={{ border: "1px solid #555", color: "#555" }}>
                      RESOLVED ✓
                    </button>
                    <span className="font-mono text-[10px] text-[#333]">
                      {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {resolved.length > 0 && (
            <div>
              <p className="font-mono text-[10px] tracking-[3px] text-[#333] mb-3 px-1">── RESOLVED ──</p>
              {resolved.map((b) => (
                <div key={b.id} className="rounded-xl p-4 mb-2 opacity-40"
                  style={{ background: "#111111", border: "0.5px solid #2A2A2A" }}>
                  <p className="text-sm text-[#555] line-through mb-1">{b.description}</p>
                  <span className="font-mono text-[10px] text-[#333]" style={{ color: b.project.color }}>
                    {b.project.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setShowAdd(true)}
            className="w-full font-mono text-[10px] tracking-[3px] py-4 rounded-xl btn-press"
            style={{ border: "1px dashed #FF474740", color: "#FF474780" }}>
            + FLAG NEW BLOCKER
          </button>
        </section>
      )}

      {/* Add blocker sheet */}
      {showAdd && (
        <div className="fixed inset-0 flex items-end" style={{ background: "#08080899", zIndex: 50 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full rounded-t-2xl p-6 space-y-4 slide-in-right"
            style={{ background: "#111111", border: "0.5px solid #2A2A2A" }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: "#2A2A2A" }} />
            <p className="font-impact text-[24px] tracking-wider text-stuck">WHAT&apos;S STUCK?</p>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the blocker..."
              className="w-full rounded-lg px-4 py-3 text-sm placeholder-[#333]"
              style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
            <p className="font-impact text-[24px] tracking-wider text-white">WHY IS IT STUCK?</p>
            <p className="font-mono text-[10px] tracking-[2px] text-[#555]">
              BE SPECIFIC. THIS FORCES YOU TO THINK.
            </p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Why exactly is this blocked?"
              rows={3}
              className="w-full rounded-lg px-4 py-3 text-sm placeholder-[#333] resize-none"
              style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />
            <button onClick={addBlocker}
              className="w-full h-[52px] rounded-lg font-impact text-[18px] tracking-[4px] btn-press"
              style={{ background: "#FF4747", color: "#080808" }}>
              SAVE BLOCKER
            </button>
          </div>
        </div>
      )}
    </>
  );
}
