"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "./ProjectCard";
import { Celebration } from "./Celebration";

type Project = {
  id: string;
  name: string;
  fullName: string;
  color: string;
  currentPhase: string;
  status: string;
  streak: number;
  focuses: { id: string; task: string; completed: boolean }[];
  milestones: { id: string; title: string; targetDate: string }[];
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "SHIP SOMETHING TODAY.";
  if (hour < 17) return "STILL BUILDING?";
  if (hour < 21) return "FINISH STRONG.";
  return "WHAT DID YOU BUILD?";
}

export function HomeClient({ projects, maxStreak }: { projects: Project[]; maxStreak: number }) {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(false);

  const doneCount = projects.filter((p) => p.focuses[0]?.completed).length;
  const totalCount = projects.filter((p) => p.focuses[0]).length;

  const doneColor = doneCount === 0 ? "#FF4747" :
    doneCount < totalCount ? "#E8FF47" : "#47FFB8";

  const streakColor = maxStreak === 0 ? "#333" :
    maxStreak >= 7 ? "#E8FF47" : maxStreak >= 3 ? "#FF8C00" : "#F0F0F0";

  const checkAllDone = useCallback(() => {
    setTimeout(() => {
      router.refresh();
    }, 500);
  }, [router]);

  return (
    <>
      {celebrate && (
        <Celebration streak={maxStreak + 1} onDismiss={() => setCelebrate(false)} />
      )}

      {/* Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-5"
        style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        <div className="flex items-center gap-1">
          <span className="font-impact text-[22px] tracking-wider text-white">R2·BUILD</span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E8FF47" }} />
        </div>
        <span className={`font-mono text-xs tracking-wider ${maxStreak >= 7 ? "streak-pulse" : ""}`}
          style={{ color: streakColor }}>
          🔥 {maxStreak} DAY STREAK
        </span>
      </header>

      {/* Daily progress strip */}
      <div className="h-12 shrink-0 flex items-center justify-between px-5"
        style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        <span className="font-mono text-[11px] tracking-[3px] text-[#555]">
          {getGreeting()}
        </span>
        <span className="font-mono text-[11px] tracking-[3px]" style={{ color: doneColor }}>
          {doneCount}/{totalCount} DONE
        </span>
      </div>

      {/* Project cards */}
      <section className="flex-1 overflow-y-auto py-3 no-scrollbar">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onAllDone={checkAllDone} />
        ))}
        {projects.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center h-full px-6 text-center">
            <p className="font-impact text-[42px] leading-[0.9] text-white">
              WHAT&apos;S THE<br />ONE THING<br />TODAY?
            </p>
            <p className="font-mono text-xs text-[#555] tracking-[3px] mt-4">
              Run `npm run db:seed` to get started.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
