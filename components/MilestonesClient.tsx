"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { daysUntil, monthYear, formatMilestoneDate } from "@/lib/date";

type Milestone = {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  project: { id: string; name: string; color: string };
};

export function MilestonesClient({
  milestones,
}: {
  milestones: Milestone[];
  projects: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

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

  const open = milestones.filter((m) => !m.completed);
  const grouped = open.reduce<Record<string, Milestone[]>>((acc, m) => {
    const key = monthYear(m.targetDate);
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <>
      <header className="shrink-0 px-5 pt-6 pb-4" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        <h1 className="font-impact text-[42px] leading-none tracking-wider text-white">MILESTONES</h1>
        <p className="font-mono text-[10px] tracking-[3px] text-[#555] mt-2">
          {open.length} UPCOMING
        </p>
      </header>

      <section className="flex-1 overflow-y-auto no-scrollbar">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <div className="px-5 py-3 sticky top-0" style={{ background: "#080808", borderBottom: "0.5px solid #2A2A2A" }}>
              <span className="font-mono text-[10px] tracking-[3px] text-[#555]">── {month} ──</span>
            </div>
            <div className="space-y-3 p-4">
              {items.map((m) => {
                const days = daysUntil(m.targetDate);
                return (
                  <div key={m.id} className="rounded-xl p-5"
                    style={{ background: "#111111", border: "0.5px solid #2A2A2A" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full" style={{ background: m.project.color }} />
                      <span className="font-mono text-[10px] tracking-[3px]" style={{ color: m.project.color }}>
                        {m.project.name}
                      </span>
                      <span className="flex-1" />
                      <span className="font-mono text-[11px] text-[#555] tracking-wider">
                        {formatMilestoneDate(m.targetDate)}
                      </span>
                    </div>
                    <p className="font-impact text-[20px] tracking-wide text-white mb-2">
                      {m.title.toUpperCase()}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#555] tracking-wider">
                        {days > 0 ? `${days} DAYS` : days === 0 ? "TODAY" : `${-days} DAYS OVERDUE`}
                      </span>
                      <button onClick={() => toggle(m.id, true)}
                        className="font-mono text-[10px] tracking-[3px] px-3 py-1.5 rounded btn-press"
                        style={{ border: `1px solid ${m.project.color}40`, color: m.project.color }}>
                        COMPLETE ✓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {milestones.filter((m) => m.completed).length > 0 && (
          <div className="px-5 py-3">
            <span className="font-mono text-[10px] tracking-[3px] text-[#333]">── COMPLETED ──</span>
            {milestones.filter((m) => m.completed).map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 opacity-40"
                style={{ borderBottom: "0.5px solid #1A1A1A" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "#47FFB8" }} />
                <span className="text-sm flex-1 line-through text-[#555]">{m.title}</span>
                <span className="font-mono text-[10px] text-[#333]">{formatMilestoneDate(m.targetDate)}</span>
              </div>
            ))}
          </div>
        )}

        {milestones.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center">
            <p className="font-impact text-[42px] leading-[0.9] text-white">
              NO MILESTONES.<br />WHERE ARE YOU<br />GOING?
            </p>
          </div>
        )}
      </section>
    </>
  );
}
