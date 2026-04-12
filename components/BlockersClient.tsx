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

  return (
    <>
      <header className="shrink-0 flex items-center px-4"
        style={{ height: 56, borderBottom: "0.5px solid #2A2A2A" }}>
        <h1 className="font-impact text-[32px] leading-none tracking-wider" style={{ color: "#F0F0F0" }}>
          BLOCKERS
        </h1>
      </header>

      {!hasOpenBlockers && !showAdd ? (
        <section className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <p className="font-impact leading-[0.9]" style={{ fontSize: 64, color: "#F0F0F0" }}>
            NOTHING<br />BLOCKING.
          </p>
          <p className="font-mono text-[12px] mt-4" style={{ color: "#444444" }}>
            Ship something today.
          </p>
          <button onClick={() => setShowAdd(true)}
            className="font-impact text-[14px] tracking-[3px] mt-6 px-4 btn-press"
            style={{ height: 48, border: "1px dashed #2A2A2A", color: "#444444" }}>
            + FLAG BLOCKER
          </button>
        </section>
      ) : (
        <section className="flex-1 overflow-y-auto no-scrollbar">
          {open.map((b) => (
            <div key={b.id} className="px-4 py-4" style={{
              background: "#111111",
              borderBottom: "1px solid #080808",
              borderLeft: "3px solid #F0F0F0",
            }}>
              <p className="font-mono text-[8px] tracking-[3px] mb-1" style={{ color: "#444444" }}>WHAT:</p>
              <p className="font-impact text-[18px] tracking-wider mb-3" style={{ color: "#F0F0F0" }}>
                {b.description.toUpperCase()}
              </p>
              <p className="font-mono text-[8px] tracking-[3px] mb-1" style={{ color: "#444444" }}>WHY:</p>
              <p className="font-mono text-[12px] leading-relaxed mb-4" style={{ color: "#F0F0F060" }}>
                {b.reason}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-wider" style={{ color: "#444444" }}>
                  {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
                </span>
                <button onClick={() => resolve(b.id)}
                  className="font-mono text-[10px] tracking-[3px] px-3 btn-press"
                  style={{ height: 32, border: "0.5px solid #2A2A2A", color: "#444444" }}>
                  RESOLVED ✓
                </button>
              </div>
            </div>
          ))}

          {resolved.length > 0 && resolved.map((b) => (
            <div key={b.id} className="px-4 py-3"
              style={{ borderBottom: "0.5px solid #2A2A2A", opacity: 0.3 }}>
              <p className="font-mono text-[12px] line-through" style={{ color: "#444444" }}>{b.description}</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "#444444" }}>{b.project.name}</p>
            </div>
          ))}

          <button onClick={() => setShowAdd(true)}
            className="w-full font-impact text-[14px] tracking-[3px] btn-press"
            style={{ height: 48, border: "1px dashed #2A2A2A", color: "#444444" }}>
            + FLAG BLOCKER
          </button>
        </section>
      )}

      {/* Add blocker sheet */}
      {showAdd && (
        <div className="fixed inset-0 flex items-end" style={{ background: "#08080899", zIndex: 50 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full p-4 space-y-3" style={{ background: "#111111", borderTop: "0.5px solid #2A2A2A" }}>
            <div className="w-10 h-0.5 mx-auto mb-2" style={{ background: "#2A2A2A" }} />

            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 font-mono text-[12px]"
              style={{ background: "#080808", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <p className="font-impact text-[20px] tracking-wider" style={{ color: "#F0F0F0" }}>WHAT&apos;S STUCK?</p>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the blocker..."
              className="w-full px-3 py-3 font-mono text-[13px] placeholder-[#2A2A2A]"
              style={{ background: "#080808", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />

            <p className="font-impact text-[20px] tracking-wider" style={{ color: "#F0F0F0" }}>WHY IS IT STUCK?</p>
            <p className="font-mono text-[9px] tracking-[2px]" style={{ color: "#444444" }}>
              BE SPECIFIC. FORCES YOU TO THINK.
            </p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Why exactly is this blocked?"
              rows={3}
              className="w-full px-3 py-3 font-mono text-[13px] placeholder-[#2A2A2A] resize-none"
              style={{ background: "#080808", border: "0.5px solid #2A2A2A", color: "#F0F0F0" }} />

            <button onClick={addBlocker}
              className="w-full font-impact text-[18px] tracking-[4px] btn-press"
              style={{ height: 52, background: "#F0F0F0", color: "#080808" }}>
              SAVE BLOCKER
            </button>
          </div>
        </div>
      )}
    </>
  );
}
