"use client";

import { useState } from "react";

type Focus = {
  id: string;
  date: string;
  task: string;
  completed: boolean;
  project: { name: string; color: string };
};

type Props = {
  focuses: Focus[];
  projects: { name: string; color: string }[];
  today: string;
  weekDone: number;
  weekTotal: number;
  weekPct: number;
};

export function TasksClient({ focuses, projects, today, weekDone, weekTotal, weekPct }: Props) {
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? focuses : focuses.filter((f) => f.project.name === filter);

  const groups = filtered.reduce<Record<string, Focus[]>>((acc, f) => {
    (acc[f.date] ??= []).push(f);
    return acc;
  }, {});

  function labelFor(date: string) {
    if (date === today) return "TODAY";
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (date === y.toISOString().slice(0, 10)) return "YESTERDAY";
    const d = new Date(date + "T00:00:00");
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
  }

  return (
    <>
      <header className="shrink-0 px-5 pt-6 pb-4" style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        <h1 className="font-impact text-[42px] leading-none tracking-wider text-white">TASK LOG</h1>
      </header>

      {/* Filter row */}
      <div className="shrink-0 flex items-center gap-2 px-5 py-3 overflow-x-auto no-scrollbar"
        style={{ borderBottom: "0.5px solid #2A2A2A" }}>
        <button onClick={() => setFilter("ALL")}
          className="font-mono text-[10px] tracking-[3px] px-3 py-1.5 rounded-full btn-press shrink-0"
          style={{
            background: filter === "ALL" ? "#F0F0F0" : "transparent",
            color: filter === "ALL" ? "#080808" : "#555",
            border: `1px solid ${filter === "ALL" ? "#F0F0F0" : "#2A2A2A"}`,
          }}>
          ALL
        </button>
        {projects.map((p) => (
          <button key={p.name} onClick={() => setFilter(p.name)}
            className="font-mono text-[10px] tracking-[3px] px-3 py-1.5 rounded-full btn-press shrink-0"
            style={{
              background: filter === p.name ? p.color : "transparent",
              color: filter === p.name ? "#080808" : "#555",
              border: `1px solid ${filter === p.name ? p.color : "#2A2A2A"}`,
            }}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Task list */}
      <section className="flex-1 overflow-y-auto no-scrollbar">
        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="px-5 py-2.5 sticky top-0" style={{ background: "#080808", borderBottom: "0.5px solid #2A2A2A" }}>
              <span className="font-mono text-[10px] tracking-[3px] text-[#555]">
                ── {labelFor(date)} ──
              </span>
            </div>
            {items.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: "0.5px solid #1A1A1A" }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.project.color }} />
                <span className="font-mono text-[11px] tracking-[2px] w-12 shrink-0" style={{ color: f.project.color }}>
                  {f.project.name}
                </span>
                <span className={`text-sm flex-1 truncate ${f.completed ? "text-[#F0F0F0]" : "text-[#555]"}`}>
                  {f.task}
                </span>
                <span className="shrink-0 text-xs">
                  {f.completed ? (
                    <span style={{ color: "#47FFB8" }}>✓</span>
                  ) : (
                    <span style={{ color: "#333" }}>○</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="font-mono text-xs text-[#555] tracking-[3px]">NO TASKS YET.</p>
          </div>
        )}
      </section>

      {/* Week stats */}
      <div className="shrink-0 px-5 py-3" style={{ borderTop: "0.5px solid #2A2A2A" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-[3px] text-[#555]">THIS WEEK</span>
          <span className="font-mono text-[10px] tracking-[3px] text-[#555]">
            {weekDone}/{weekTotal} TASKS — {weekPct}%
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1A1A1A" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${weekPct}%`, background: "#47FFB8" }} />
        </div>
      </div>
    </>
  );
}
