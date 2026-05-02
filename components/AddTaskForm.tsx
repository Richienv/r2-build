"use client";

import { useState } from "react";

type ProjectOpt = { name: string; color: string };

export type NewTaskInput = {
  title: string;
  projectKey: string | null;
  dueDate: string;
  dueTime: string | null;
  estimatedMinutes: number | null;
};

const ESTIMATE_PRESETS: { label: string; minutes: number }[] = [
  { label: "15M", minutes: 15 },
  { label: "30M", minutes: 30 },
  { label: "1H", minutes: 60 },
  { label: "2H", minutes: 120 },
  { label: "4H", minutes: 240 },
];

export function AddTaskForm({
  projects,
  today,
  defaultProject,
  defaultDueTime,
  onCancel,
  onSubmit,
}: {
  projects: ProjectOpt[];
  today: string;
  defaultProject?: string | null;
  defaultDueTime?: string | null;
  onCancel: () => void;
  onSubmit: (input: NewTaskInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectKey, setProjectKey] = useState<string | null>(
    defaultProject !== undefined ? defaultProject : projects[0]?.name ?? null,
  );
  const [dueDate, setDueDate] = useState(today);
  const [dueTime, setDueTime] = useState<string>(defaultDueTime ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);

  const valid = title.trim().length > 0;

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[3px] mb-4" style={{ color: "#555" }}>
        NEW TASK
      </p>

      <label className="font-mono text-[9px] tracking-[2px] block mb-1" style={{ color: "#555" }}>
        TASK
      </label>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        className="w-full bg-transparent outline-none font-sans mb-5"
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: "#F0F0F0",
          borderBottom: "1px solid #2a2a2a",
          paddingBottom: 6,
        }}
      />

      <label className="font-mono text-[9px] tracking-[2px] block mb-2" style={{ color: "#555" }}>
        PROJECT
      </label>
      <div className="flex gap-2 mb-5 flex-wrap">
        {projects.map((p) => {
          const active = projectKey === p.name;
          return (
            <button
              key={p.name}
              onClick={() => setProjectKey(p.name)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3 flex items-center gap-2"
              style={{
                height: 32,
                color: active ? "#080808" : "#999",
                background: active ? p.color : "transparent",
                border: `1px solid ${active ? p.color : "#2a2a2a"}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: active ? "#080808" : p.color,
                }}
              />
              {p.name}
            </button>
          );
        })}
        <button
          onClick={() => setProjectKey(null)}
          className="btn-press font-mono text-[9px] tracking-[2px] px-3"
          style={{
            height: 32,
            color: projectKey === null ? "#080808" : "#555",
            background: projectKey === null ? "#E8FF47" : "transparent",
            border: `1px solid ${projectKey === null ? "#E8FF47" : "#2a2a2a"}`,
          }}
        >
          NONE
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div style={{ flex: 1 }}>
          <label
            className="font-mono text-[9px] tracking-[2px] block mb-2"
            style={{ color: "#555" }}
          >
            DATE
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-transparent outline-none font-mono"
            style={{
              fontSize: 14,
              color: "#F0F0F0",
              borderBottom: "1px solid #2a2a2a",
              paddingBottom: 6,
              colorScheme: "dark",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            className="font-mono text-[9px] tracking-[2px] block mb-2"
            style={{ color: "#555" }}
          >
            HOUR
          </label>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="w-full bg-transparent outline-none font-mono"
            style={{
              fontSize: 14,
              color: "#F0F0F0",
              borderBottom: "1px solid #2a2a2a",
              paddingBottom: 6,
              colorScheme: "dark",
            }}
          />
        </div>
      </div>

      <label className="font-mono text-[9px] tracking-[2px] block mb-2" style={{ color: "#555" }}>
        ESTIMATE
      </label>
      <div className="flex gap-2 mb-6 flex-wrap">
        {ESTIMATE_PRESETS.map((e) => {
          const active = estimatedMinutes === e.minutes;
          return (
            <button
              key={e.label}
              onClick={() => setEstimatedMinutes(active ? null : e.minutes)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3"
              style={{
                height: 32,
                color: active ? "#080808" : "#555",
                background: active ? "#E8FF47" : "transparent",
                border: `1px solid ${active ? "#E8FF47" : "#2a2a2a"}`,
              }}
            >
              {e.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
          style={{
            height: 48,
            color: "#555",
            background: "transparent",
            border: "1px solid #2a2a2a",
          }}
        >
          CANCEL
        </button>
        <button
          onClick={() =>
            valid &&
            onSubmit({
              title: title.trim(),
              projectKey,
              dueDate,
              dueTime: dueTime || null,
              estimatedMinutes,
            })
          }
          disabled={!valid}
          className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
          style={{
            height: 48,
            color: valid ? "#080808" : "#555",
            background: valid ? "#E8FF47" : "transparent",
            border: `1px solid ${valid ? "#E8FF47" : "#2a2a2a"}`,
          }}
        >
          ADD TASK
        </button>
      </div>
    </div>
  );
}
