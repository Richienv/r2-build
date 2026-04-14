"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  projectKey: string;
  date: string;
  type: string;
  notes: string | null;
};

type ProjectOpt = { name: string; color: string };

const EVENT_TYPES = ["MILESTONE", "MEETING", "LAUNCH", "DEADLINE", "OTHER"] as const;

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function eventDay(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TimelineClient({
  events,
  projects,
  today,
}: {
  events: Event[];
  projects: ProjectOpt[];
  today: string;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return events;
    return events.filter((e) => e.projectKey === filter);
  }, [events, filter]);

  const withTodayMarker = useMemo(() => {
    const items: Array<{ kind: "event"; event: Event } | { kind: "today" }> = [];
    let todayInserted = false;
    for (const e of filtered) {
      if (!todayInserted && eventDay(e.date) > today) {
        items.push({ kind: "today" });
        todayInserted = true;
      }
      items.push({ kind: "event", event: e });
    }
    if (!todayInserted) items.push({ kind: "today" });
    return items;
  }, [filtered, today]);

  async function createEvent(
    title: string,
    projectKey: string,
    date: string,
    type: string,
    notes: string,
  ) {
    await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        projectKey,
        date: new Date(date + "T00:00:00").toISOString(),
        type,
        notes: notes || null,
      }),
    });
    setShowAdd(false);
    router.refresh();
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/timeline?id=${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    router.refresh();
  }

  const projectColor = (key: string) =>
    projects.find((p) => p.name === key)?.color ?? "#555";

  return (
    <>
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 56, borderBottom: "0.5px solid #222" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-[14px] btn-press"
            style={{ color: "#444" }}
          >
            ←
          </Link>
          <span className="font-impact" style={{ fontSize: 28, color: "#F0F0F0", letterSpacing: "1px" }}>
            TIMELINE
          </span>
        </div>
        <span
          className="font-mono text-[9px] tracking-[2px]"
          style={{ color: "#444" }}
        >
          {events.length} EVENTS
        </span>
      </header>

      {/* Filter pills */}
      <div
        className="shrink-0 flex items-center gap-2 px-5 overflow-x-auto no-scrollbar"
        style={{ height: 44, borderBottom: "0.5px solid #1a1a1a" }}
      >
        {["ALL", ...projects.map((p) => p.name)].map((label) => {
          const active = filter === label;
          return (
            <button
              key={label}
              onClick={() => setFilter(label)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3 shrink-0"
              style={{
                height: 26,
                color: active ? "#080808" : "#555",
                background: active ? "#E8FF47" : "transparent",
                border: `1px solid ${active ? "#E8FF47" : "#2a2a2a"}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 120 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <p
              className="font-mono text-[10px] tracking-[3px] text-center"
              style={{ color: "#444" }}
            >
              NO EVENTS YET
            </p>
            <p
              className="font-mono text-[9px] tracking-[2px] text-center mt-2"
              style={{ color: "#333" }}
            >
              TAP + TO ADD
            </p>
          </div>
        ) : (
          <div style={{ padding: "20px 20px 20px 20px" }}>
            {withTodayMarker.map((item, idx) => {
              const isLast = idx === withTodayMarker.length - 1;
              if (item.kind === "today") {
                return (
                  <div
                    key={`today-${idx}`}
                    className="flex items-center"
                    style={{ position: "relative", minHeight: 48 }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 15,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: isLast ? "transparent" : "#1a1a1a",
                      }}
                    />
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        background: "#E8FF47",
                        border: "3px solid #080808",
                        boxShadow: "0 0 0 2px #E8FF47, 0 0 12px rgba(232,255,71,0.6)",
                        marginLeft: 9,
                        zIndex: 1,
                      }}
                    />
                    <div style={{ marginLeft: 20 }}>
                      <span
                        className="font-mono uppercase"
                        style={{
                          fontSize: 10,
                          color: "#E8FF47",
                          letterSpacing: "2px",
                        }}
                      >
                        TODAY
                      </span>
                    </div>
                  </div>
                );
              }

              const { event } = item;
              const day = eventDay(event.date);
              const past = day < today;
              const color = projectColor(event.projectKey);
              return (
                <div
                  key={event.id}
                  className="flex items-start"
                  style={{ position: "relative", paddingBottom: 24 }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 15,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "#1a1a1a",
                    }}
                  />
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: past ? "transparent" : color,
                      border: `1.5px solid ${color}`,
                      marginLeft: 11,
                      marginTop: 4,
                      zIndex: 1,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ marginLeft: 20, flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-mono uppercase"
                        style={{
                          fontSize: 10,
                          color: "#555",
                          letterSpacing: "1.5px",
                        }}
                      >
                        {formatEventDate(event.date)}
                      </span>
                      <span
                        className="font-mono uppercase"
                        style={{
                          fontSize: 9,
                          color: color,
                          letterSpacing: "1.5px",
                        }}
                      >
                        · {event.projectKey}
                      </span>
                      <span
                        className="font-mono uppercase"
                        style={{
                          fontSize: 8,
                          color: "#333",
                          letterSpacing: "1.5px",
                          marginLeft: "auto",
                        }}
                      >
                        {event.type}
                      </span>
                    </div>
                    <p
                      className="font-sans"
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: past ? "#555" : "#F0F0F0",
                        marginBottom: event.notes ? 4 : 0,
                      }}
                    >
                      {event.title}
                    </p>
                    {event.notes && (
                      <p
                        className="font-sans"
                        style={{
                          fontSize: 12,
                          color: "#666",
                          lineHeight: 1.4,
                        }}
                      >
                        {event.notes}
                      </p>
                    )}
                    <button
                      onClick={() => setConfirmDelete(event.id)}
                      className="btn-press font-mono"
                      style={{
                        fontSize: 9,
                        color: "#333",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        marginTop: 6,
                        letterSpacing: "1.5px",
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="btn-press"
        style={{
          position: "fixed",
          right: 20,
          bottom: 88,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "#E8FF47",
          color: "#080808",
          fontSize: 28,
          fontWeight: 700,
          border: "none",
          boxShadow: "0 4px 20px rgba(232,255,71,0.4)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          paddingBottom: 4,
        }}
      >
        +
      </button>

      {/* Add sheet */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAdd(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
            style={{
              background: "#111",
              borderTop: "1px solid #2a2a2a",
              padding: "24px 20px 32px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <AddEventForm
              projects={projects}
              today={today}
              onCancel={() => setShowAdd(false)}
              onSubmit={createEvent}
            />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
            style={{
              background: "#111",
              borderTop: "1px solid #2a2a2a",
              padding: "24px 20px 32px",
            }}
          >
            <p className="font-impact mb-2" style={{ fontSize: 20, color: "#F0F0F0", letterSpacing: "1px" }}>
              REMOVE EVENT?
            </p>
            <p className="font-mono text-[11px] mb-5" style={{ color: "#555" }}>
              This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
                style={{
                  height: 48,
                  color: "#F0F0F0",
                  background: "transparent",
                  border: "1px solid #2a2a2a",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => deleteEvent(confirmDelete)}
                className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
                style={{
                  height: 48,
                  color: "#FF4747",
                  background: "transparent",
                  border: "1px solid #FF4747",
                }}
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AddEventForm({
  projects,
  today,
  onCancel,
  onSubmit,
}: {
  projects: ProjectOpt[];
  today: string;
  onCancel: () => void;
  onSubmit: (title: string, projectKey: string, date: string, type: string, notes: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectKey, setProjectKey] = useState<string>(projects[0]?.name ?? "");
  const [date, setDate] = useState(today);
  const [type, setType] = useState<string>("MILESTONE");
  const [notes, setNotes] = useState("");

  const valid = title.trim() && projectKey;

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[3px] mb-4" style={{ color: "#555" }}>
        NEW EVENT
      </p>

      <label className="font-mono text-[9px] tracking-[2px] block mb-1" style={{ color: "#555" }}>
        TITLE
      </label>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="IB presentation, beta launch..."
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
              className="btn-press font-mono text-[9px] tracking-[2px] px-3"
              style={{
                height: 32,
                color: active ? "#080808" : "#555",
                background: active ? "#E8FF47" : "transparent",
                border: `1px solid ${active ? "#E8FF47" : "#2a2a2a"}`,
              }}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      <label className="font-mono text-[9px] tracking-[2px] block mb-2" style={{ color: "#555" }}>
        DATE
      </label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-transparent outline-none font-mono mb-5"
        style={{
          fontSize: 14,
          color: "#F0F0F0",
          borderBottom: "1px solid #2a2a2a",
          paddingBottom: 6,
          colorScheme: "dark",
        }}
      />

      <label className="font-mono text-[9px] tracking-[2px] block mb-2" style={{ color: "#555" }}>
        TYPE
      </label>
      <div className="flex gap-2 mb-5 flex-wrap">
        {EVENT_TYPES.map((t) => {
          const active = type === t;
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className="btn-press font-mono text-[9px] tracking-[2px] px-3"
              style={{
                height: 32,
                color: active ? "#080808" : "#555",
                background: active ? "#E8FF47" : "transparent",
                border: `1px solid ${active ? "#E8FF47" : "#2a2a2a"}`,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <label className="font-mono text-[9px] tracking-[2px] block mb-2" style={{ color: "#555" }}>
        NOTES
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional"
        rows={3}
        className="w-full bg-transparent outline-none font-sans mb-6"
        style={{
          fontSize: 14,
          color: "#F0F0F0",
          borderBottom: "1px solid #2a2a2a",
          paddingBottom: 6,
          resize: "none",
        }}
      />

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
          onClick={() => valid && onSubmit(title.trim(), projectKey, date, type, notes.trim())}
          disabled={!valid}
          className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
          style={{
            height: 48,
            color: valid ? "#080808" : "#555",
            background: valid ? "#E8FF47" : "transparent",
            border: `1px solid ${valid ? "#E8FF47" : "#2a2a2a"}`,
          }}
        >
          ADD TO TIMELINE
        </button>
      </div>
    </div>
  );
}
