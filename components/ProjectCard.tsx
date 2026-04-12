"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMilestoneDate } from "@/lib/date";

type Project = {
  id: string;
  name: string;
  color: string;
  currentPhase: string;
  status: string;
  streak: number;
  focuses: { id: string; task: string; completed: boolean }[];
  milestones: { id: string; title: string; targetDate: string }[];
};

export function ProjectCard({ project, onDone }: { project: Project; onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const focus = project.focuses[0];
  const milestone = project.milestones[0];
  const [localDone, setLocalDone] = useState(focus?.completed ?? false);

  function markDone(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!focus || localDone || pending) return;
    setLocalDone(true);
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: focus.id, completed: true }),
      });
      router.refresh();
      onDone?.();
    });
  }

  return (
    <Link href={`/project/${project.id}`}
      className="block"
      style={{
        background: "#111111",
        borderBottom: "1px solid #080808",
        borderLeft: `3px solid ${localDone ? "#F0F0F020" : "#F0F0F0"}`,
        padding: "20px 16px",
      }}>

      {/* Row 1: name + status */}
      <div className="flex items-center justify-between" style={{ height: 28 }}>
        <span className="font-impact text-[18px] tracking-wide" style={{ color: "#F0F0F0" }}>
          {project.name}
        </span>
        <span className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>
          {project.status}
        </span>
      </div>

      <div className="my-2" style={{ height: "0.5px", background: "#2A2A2A" }} />

      {/* Row 2: label */}
      <p className="font-mono text-[8px] tracking-[3px] mb-1" style={{ color: "#444444" }}>
        TODAY&apos;S ONE THING:
      </p>

      {/* Row 3: task */}
      {focus ? (
        <p className={`font-impact leading-[0.95] my-3 ${localDone ? "strike-anim" : ""}`}
          style={{ fontSize: 28, color: localDone ? "#444444" : "#F0F0F0" }}>
          {focus.task.toUpperCase()}.
        </p>
      ) : (
        <p className="font-impact text-[28px] leading-[0.95] my-3" style={{ color: "#2A2A2A" }}>
          NO TASK SET.
        </p>
      )}

      {/* Row 4: meta */}
      <div className="my-2" style={{ height: "0.5px", background: "#2A2A2A" }} />
      <div className="flex items-center justify-between" style={{ height: 24 }}>
        <span className="font-mono text-[9px] tracking-wider truncate pr-4" style={{ color: "#444444" }}>
          {project.currentPhase}
        </span>
        {milestone && (
          <span className="font-mono text-[9px] tracking-wider shrink-0" style={{ color: "#444444" }}>
            {formatMilestoneDate(milestone.targetDate)} NEXT
          </span>
        )}
      </div>

      {/* Row 5: streak */}
      <div className="mt-2 mb-3" style={{ height: 24 }}>
        <span className="font-mono text-[10px] tracking-wider"
          style={{ color: project.streak > 0 ? "#F0F0F0" : "#444444" }}>
          🔥 {localDone && !focus?.completed ? project.streak + 1 : project.streak} DAY{project.streak === 1 && !localDone ? "" : "S"}
        </span>
      </div>

      {/* Row 6: done button */}
      <button onClick={markDone}
        disabled={localDone || pending || !focus}
        className="w-full btn-press font-impact text-[16px] tracking-[4px]"
        style={{
          height: 48,
          background: localDone ? "#F0F0F010" : "transparent",
          border: "0.5px solid #2A2A2A",
          color: localDone ? "#F0F0F030" : "#444444",
        }}>
        {localDone ? "✓ DONE" : "DONE ✓"}
      </button>
    </Link>
  );
}
