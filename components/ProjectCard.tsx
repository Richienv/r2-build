"use client";

import { useState, useTransition, useRef } from "react";
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

export function ProjectCard({
  project,
  onAllDone,
}: {
  project: Project;
  onAllDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const focus = project.focuses[0];
  const milestone = project.milestones[0];
  const [localDone, setLocalDone] = useState(focus?.completed ?? false);
  const [showCheck, setShowCheck] = useState(focus?.completed ?? false);

  const touchStartX = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const [swipeAction, setSwipeAction] = useState<"none" | "stuck" | "edit">("none");

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 20) {
      setSwipeX(Math.max(-120, Math.min(120, dx)));
      setSwipeAction(dx < -40 ? "stuck" : dx > 40 ? "edit" : "none");
    }
  }

  function handleTouchEnd() {
    setSwipeX(0);
    if (swipeAction === "stuck") {
      window.location.href = `/project/${project.id}?tab=blockers&add=true`;
    } else if (swipeAction === "edit") {
      window.location.href = `/project/${project.id}?tab=focus`;
    }
    setSwipeAction("none");
  }

  function markDone(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!focus || localDone || pending) return;
    setLocalDone(true);
    setTimeout(() => setShowCheck(true), 150);
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: focus.id, completed: true }),
      });
      router.refresh();
      onAllDone?.();
    });
  }

  const statusColor =
    project.status === "STUCK" ? "#FF4747" :
    project.status === "WAITING" ? "#888888" :
    project.status === "DONE" ? "#47FFB8" : project.color;

  return (
    <div className="relative mx-4 mb-3"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>

      {/* Swipe action backgrounds */}
      {swipeX < -20 && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-end px-6 bg-stuck/20">
          <span className="font-mono text-xs tracking-[3px] text-stuck">MARK STUCK</span>
        </div>
      )}
      {swipeX > 20 && (
        <div className="absolute inset-0 rounded-xl flex items-center px-6 bg-white/5">
          <span className="font-mono text-xs tracking-[3px] text-white/60">EDIT TASK</span>
        </div>
      )}

      <Link href={`/project/${project.id}`}
        className="swipe-card block relative rounded-xl p-6"
        style={{
          background: "#111111",
          border: "0.5px solid #2A2A2A",
          borderLeftWidth: 4,
          borderLeftColor: localDone ? "#47FFB8" : project.color,
          transform: `translateX(${swipeX}px)`,
        }}>

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-impact text-[28px] leading-none tracking-wide">{project.name}</span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
            <span className="w-8 h-px" style={{ backgroundColor: "#2A2A2A" }} />
          </div>
          <span className="font-mono text-[10px] tracking-[3px]" style={{ color: statusColor }}>
            {project.status}
          </span>
        </div>

        <div className="h-px mb-4" style={{ background: "#2A2A2A" }} />

        {/* Today's one thing */}
        <p className="font-mono text-[10px] tracking-[3px] mb-2" style={{ color: "#555" }}>
          TODAY&apos;S ONE THING:
        </p>
        {focus ? (
          <p className={`font-impact leading-[0.88] mb-5 relative ${localDone ? "strike-anim" : ""}`}
            style={{
              fontSize: "36px",
              color: localDone ? "#555" : project.color,
            }}>
            {focus.task.toUpperCase()}.
          </p>
        ) : (
          <p className="font-impact text-[36px] leading-[0.88] mb-5" style={{ color: "#333" }}>
            NO TASK SET.
          </p>
        )}

        <div className="h-px mb-4" style={{ background: "#2A2A2A" }} />

        {/* Phase + milestone */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[11px] text-[#555] tracking-wider truncate pr-4">
            {project.currentPhase}
          </span>
          {milestone && (
            <span className="font-mono text-[11px] text-[#555] tracking-wider shrink-0">
              {formatMilestoneDate(milestone.targetDate)} next
            </span>
          )}
        </div>

        {/* Streak bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1A1A1A" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (project.streak / 7) * 100)}%`,
                backgroundColor: project.color,
              }} />
          </div>
          <span className={`font-mono text-[11px] tracking-wider ${showCheck ? "number-roll" : ""}`}
            style={{ color: project.streak >= 7 ? project.color : "#555" }}>
            🔥 {localDone ? project.streak + 1 : project.streak} DAY{project.streak === 1 && !localDone ? "" : "S"}
          </span>
        </div>

        {/* Done button */}
        <button onClick={markDone}
          disabled={localDone || pending || !focus}
          className="w-full h-[52px] rounded-lg font-impact text-[20px] tracking-[4px] btn-press transition-all duration-200"
          style={{
            background: localDone ? "#47FFB8" : `${project.color}15`,
            border: `1px solid ${localDone ? "#47FFB8" : project.color}${localDone ? "" : "66"}`,
            color: localDone ? "#080808" : project.color,
          }}>
          {localDone ? (
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" className={showCheck ? "draw-check" : ""} />
              </svg>
              DONE
            </span>
          ) : (
            "DONE ✓"
          )}
        </button>
      </Link>
    </div>
  );
}
