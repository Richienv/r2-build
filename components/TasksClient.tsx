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
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4" style={{ height: 56, borderBottom: "0.5px solid #2A2A2A" }}>
        <h1 className="font-impact text-[32px] leading-none tracking-wider" style={{ color: "#F0F0F0" }}>
          TASK LOG
        </h1>
      </header>

      {/* Filter */}
      <div className="shrink-0 flex items-center gap-2 px-4 overflow-x-auto no-scrollbar"
        style={{ height: 40, borderBottom: "0.5px solid #2A2A2A" }}>
        {["ALL", ...projects.map((p) => p.name)].map((name) => (
          <button key={name} onClick={() => setFilter(name)}
            className="font-impact text-[12px] tracking-wider px-3 shrink-0 btn-press"
            style={{
              height: 28,
              background: filter === name ? "#F0F0F0" : "transparent",
              color: filter === name ? "#080808" : "#444444",
              border: `0.5px solid ${filter === name ? "#F0F0F0" : "#2A2A2A"}`,
            }}>
            {name}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <section className="flex-1 overflow-y-auto no-scrollbar">
        {Object.entries(groups).map(([date, items]) => {
          const isToday = date === today;
          return (
            <div key={date}>
              <div className="px-4 py-2 sticky top-0" style={{ background: "#080808" }}>
                <span className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>
                  ── {labelFor(date)} ──
                </span>
              </div>
              {items.map((f) => (
                <div key={f.id} className="flex items-center px-4"
                  style={{ height: 52, borderBottom: "0.5px solid #2A2A2A" }}>
                  <span className="font-impact text-[14px] tracking-wider shrink-0"
                    style={{ width: 80, color: isToday ? "#F0F0F0" : "#444444" }}>
                    {f.project.name}
                  </span>
                  <span className="font-mono text-[13px] flex-1 truncate px-2"
                    style={{ color: isToday ? "#F0F0F080" : "#444444" }}>
                    {f.task}
                  </span>
                  <span className="shrink-0 w-4 h-4 flex items-center justify-center"
                    style={f.completed ? {
                      background: "#F0F0F0",
                      borderRadius: "50%",
                      color: "#080808",
                      fontSize: 10,
                    } : {
                      border: "1px solid #2A2A2A",
                      borderRadius: "50%",
                    }}>
                    {f.completed ? "✓" : ""}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>NO TASKS YET.</p>
          </div>
        )}
      </section>

      {/* Week stats */}
      <div className="shrink-0 flex items-center justify-center px-4"
        style={{ height: 40, borderTop: "0.5px solid #2A2A2A", background: "#080808" }}>
        <span className="font-mono text-[9px] tracking-[3px]" style={{ color: "#444444" }}>
          THIS WEEK: {weekDone}/{weekTotal} TASKS · {weekPct}%
        </span>
      </div>
    </>
  );
}
