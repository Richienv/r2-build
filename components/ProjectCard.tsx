"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { StatusPill } from "./StatusPill";
import { formatMilestoneDate } from "@/lib/date";

type Project = {
  id: string;
  name: string;
  fullName: string;
  color: string;
  currentPhase: string;
  status: "BUILDING" | "STUCK" | "WAITING" | "PAUSED" | "DONE";
  streak: number;
  focuses: { id: string; task: string; completed: boolean }[];
  milestones: { id: string; title: string; targetDate: string }[];
};

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const focus = project.focuses[0];
  const milestone = project.milestones[0];
  const [localDone, setLocalDone] = useState(focus?.completed ?? false);

  function markDone(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!focus || localDone) return;
    setLocalDone(true);
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: focus.id, completed: true }),
      });
      router.refresh();
    });
  }

  return (
    <Link
      href={`/project/${project.id}`}
      className="group flex flex-col bg-surface border border-border rounded-lg overflow-hidden relative transition-colors hover:border-accent-dim/60 flex-1 min-h-0"
      style={{ borderLeftColor: project.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl tracking-wide">{project.name}</span>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
        </div>
        <StatusPill status={project.status} />
      </div>

      <div className="h-px bg-border mx-4 mt-3" />

      <div className="flex-1 flex flex-col px-4 py-3 gap-2 min-h-0">
        <p className="text-[10px] font-mono tracking-widest text-muted">TODAY</p>
        <p className="text-sm text-text line-clamp-2 leading-snug">
          {focus?.task ?? "No task set"}
        </p>

        <div className="mt-auto space-y-2 pt-2">
          <p className="text-[10px] font-mono tracking-wider text-accent-dim truncate">
            {project.currentPhase}
          </p>
          {milestone && (
            <div className="flex items-center justify-between text-[10px] font-mono text-muted">
              <span className="truncate pr-2">NEXT: {milestone.title}</span>
              <span className="shrink-0">{formatMilestoneDate(milestone.targetDate)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-[11px] font-mono text-accent-dim">
          🔥 {project.streak} DAY{project.streak === 1 ? "" : "S"}
        </span>
        <button
          onClick={markDone}
          disabled={localDone || pending || !focus}
          className={clsx(
            "text-[10px] font-mono tracking-widest px-3 py-1.5 border rounded transition-all",
            localDone
              ? "bg-done/15 border-done/40 text-done"
              : "border-accent-dim text-accent-dim hover:bg-accent hover:text-bg hover:border-accent"
          )}
        >
          {localDone ? "DONE ✓" : "MARK DONE"}
        </button>
      </div>
    </Link>
  );
}
