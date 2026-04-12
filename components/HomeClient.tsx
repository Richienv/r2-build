"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "./ProjectCard";
import { Celebration } from "./Celebration";
import { R2OSLink } from "./R2OSLink";

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
  const h = new Date().getHours();
  if (h < 12) return "SHIP SOMETHING TODAY.";
  if (h < 17) return "STILL BUILDING?";
  if (h < 21) return "FINISH STRONG.";
  return "WHAT DID YOU SHIP?";
}

export function HomeClient({ projects, maxStreak }: { projects: Project[]; maxStreak: number }) {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(false);

  const doneCount = projects.filter((p) => p.focuses[0]?.completed).length;
  const totalCount = projects.filter((p) => p.focuses[0]).length;

  const doneColor = doneCount === 0 ? "#444444" :
    doneCount < totalCount ? "#F0F0F080" : "#F0F0F0";

  const checkDone = useCallback(() => {
    setTimeout(() => router.refresh(), 500);
  }, [router]);

  return (
    <>
      {celebrate && <Celebration streak={maxStreak + 1} onDismiss={() => setCelebrate(false)} />}

      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4"
        style={{ height: 56, borderBottom: "0.5px solid #2A2A2A" }}>
        <span className="font-impact text-[20px] tracking-wider" style={{ color: "#F0F0F0" }}>
          R2·BUILD
        </span>
        <R2OSLink />
        <span className="font-mono text-[10px] tracking-wider"
          style={{ color: maxStreak > 0 ? "#F0F0F0" : "#444444" }}>
          🔥 {maxStreak} DAY STREAK
        </span>
      </header>

      {/* Progress strip */}
      <div className="shrink-0 flex items-center justify-between px-4"
        style={{ height: 40, borderBottom: "0.5px solid #2A2A2A" }}>
        <span className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>
          {getGreeting()}
        </span>
        <span className="font-mono text-[10px] tracking-[3px]" style={{ color: doneColor }}>
          {doneCount}/{totalCount} DONE
        </span>
      </div>

      {/* Cards */}
      <section className="flex-1 overflow-y-auto no-scrollbar pb-14">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onDone={checkDone} />
        ))}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <p className="font-impact text-[32px] leading-[0.95]" style={{ color: "#F0F0F0" }}>
              NO PROJECTS YET.
            </p>
            <p className="font-mono text-[9px] tracking-[3px] mt-4" style={{ color: "#444444" }}>
              RUN NPM RUN DB:SEED
            </p>
          </div>
        )}
      </section>
    </>
  );
}
