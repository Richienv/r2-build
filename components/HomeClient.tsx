"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  status: string;
  focus: { task: string; completed: boolean } | null;
};

const EMOJIS: Record<string, string> = {
  ERP: "🔨",
  OIC: "⚡",
  "R2·FIT": "💪",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "SHIP SOMETHING TODAY.";
  if (h < 17) return "STILL BUILDING?";
  if (h < 21) return "FINISH STRONG.";
  return "WHAT DID YOU BUILD?";
}

function getDateStr(): string {
  const now = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} · ${h12}:${m} ${ampm}`;
}

export function HomeClient({
  projects,
  maxStreak,
  blockerProjectName,
}: {
  projects: Project[];
  maxStreak: number;
  blockerProjectName: string | null;
}) {
  const [dateStr, setDateStr] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setDateStr(getDateStr());
    setGreeting(getGreeting());
  }, []);

  const withFocus = projects.filter((p) => p.focus);
  const doneCount = withFocus.filter((p) => p.focus!.completed).length;
  const totalCount = withFocus.length;
  const remaining = totalCount - doneCount;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const pct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <>
      {/* Header 52px */}
      <header className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 52, borderBottom: "0.5px solid #222" }}>
        <span className="font-impact text-[20px] tracking-wider" style={{ color: "#F0F0F0" }}>
          R2·BUILD
        </span>
        <span className="font-mono text-[10px] tracking-wider" style={{ color: "#444" }}>
          🔥 {maxStreak} DAY STREAK
        </span>
      </header>

      {/* Context strip 40px */}
      <div className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 40, borderBottom: "0.5px solid #222" }}>
        <span className="font-mono text-[9px] tracking-wider" style={{ color: "#444" }}>
          {dateStr}
        </span>
        <span className="font-mono text-[9px] tracking-wider" style={{ color: "#444" }}>
          {greeting}
        </span>
      </div>

      {/* Blocker warning strip */}
      {blockerProjectName && (
        <Link href="/blockers" className="shrink-0 flex items-center px-5 btn-press"
          style={{ height: 36, background: "#1A1A1A", borderBottom: "1px solid #F0F0F015" }}>
          <span className="font-mono text-[9px] tracking-wider" style={{ color: "#F0F0F060" }}>
            ⚠ BLOCKER: {blockerProjectName}
          </span>
        </Link>
      )}

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center">
        <p className="font-mono text-[9px] tracking-[3px] uppercase" style={{ color: "#444" }}>
          TODAY
        </p>
        <p className="font-impact leading-none mt-2"
          style={{ fontSize: 80, color: "#E8FF47" }}>
          {doneCount}/{totalCount}
        </p>
        <p className="font-mono text-[10px] tracking-[3px] mt-1" style={{ color: "#444" }}>
          TASKS DONE
        </p>

        {/* Progress bar */}
        <div className="mt-4" style={{ width: 240, height: 3, background: "#222", borderRadius: 1.5 }}>
          <div style={{
            width: `${pct}%`,
            height: "100%",
            background: "#E8FF47",
            borderRadius: 1.5,
            transition: "width 300ms ease",
          }} />
        </div>

        <p className="font-mono text-[9px] tracking-wider mt-2" style={{ color: allDone ? "#E8FF47" : "#444" }}>
          {allDone ? "ALL DONE TODAY 🔥" : `${remaining} TASK${remaining === 1 ? "" : "S"} REMAINING`}
        </p>
      </section>

      {/* Project status strip */}
      <div className="shrink-0" style={{ borderTop: "0.5px solid #222", borderBottom: "0.5px solid #222" }}>
        {projects.map((p, i) => (
          <Link key={p.id} href={`/project/${p.id}`}
            className="flex items-center px-5 btn-press"
            style={{
              height: 44,
              borderBottom: i < projects.length - 1 ? "0.5px solid #222" : "none",
            }}>
            <span className="font-impact text-[14px] tracking-wider shrink-0"
              style={{ width: 56, color: "#F0F0F0" }}>
              {p.name}
            </span>
            <span className="font-mono text-[11px] flex-1 truncate px-3"
              style={{ color: "#444" }}>
              {p.focus?.task ?? "No task set"}
            </span>
            <span className="shrink-0 flex items-center justify-center"
              style={{
                width: 16, height: 16, borderRadius: "50%",
                ...(p.focus?.completed
                  ? { background: "#E8FF47" }
                  : { border: "1px solid #333" }),
              }}>
              {p.focus?.completed && (
                <span className="font-impact text-[10px]" style={{ color: "#080808" }}>✓</span>
              )}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick action buttons */}
      <div className="shrink-0 flex" style={{ borderTop: "0.5px solid #222" }}>
        {projects.map((p, i) => (
          <Link key={p.id} href={`/project/${p.id}`}
            className="flex-1 flex flex-col items-center justify-center btn-press"
            style={{
              height: 80,
              background: "#111",
              borderRight: i < projects.length - 1 ? "0.5px solid #222" : "none",
            }}>
            <span style={{ fontSize: 24 }}>{EMOJIS[p.name] ?? "📦"}</span>
            <span className="font-impact text-[13px] tracking-wider mt-1" style={{ color: "#F0F0F0" }}>
              {p.name}
            </span>
            <span className="font-mono text-[8px] tracking-wider mt-0.5"
              style={{ color: "#444" }}>
              {p.focus?.completed ? "✓ DONE" : p.focus ? "IN PROGRESS" : "NO TASK"}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
