"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type NotePreview = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function NotesListClient({ notes }: { notes: NotePreview[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function createNote() {
    if (creating) return;
    setCreating(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    });
    const data = await res.json();
    if (data.id) {
      router.push(`/notes/${data.id}`);
    } else {
      setCreating(false);
    }
  }

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
            NOTES
          </span>
        </div>
        <span
          className="font-mono text-[9px] tracking-[2px]"
          style={{ color: "#444" }}
        >
          {notes.length}
        </span>
      </header>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 120 }}>
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <p
              className="font-mono text-[10px] tracking-[3px] text-center"
              style={{ color: "#444" }}
            >
              NO NOTES YET
            </p>
            <p
              className="font-mono text-[9px] tracking-[2px] text-center mt-2"
              style={{ color: "#333" }}
            >
              TAP + TO CREATE
            </p>
          </div>
        ) : (
          notes.map((n) => (
            <Link
              key={n.id}
              href={`/notes/${n.id}`}
              className="block btn-press px-5"
              style={{
                minHeight: 80,
                borderBottom: "0.5px solid #1a1a1a",
                paddingTop: 16,
                paddingBottom: 16,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <p
                  className="font-sans truncate"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#F0F0F0",
                    flex: 1,
                  }}
                >
                  {n.title || "Untitled"}
                </p>
                <span
                  className="font-mono shrink-0"
                  style={{
                    fontSize: 9,
                    color: "#444",
                    letterSpacing: "1.5px",
                  }}
                >
                  {formatDate(n.updatedAt)}
                </span>
              </div>
              {n.preview && (
                <p
                  className="font-sans truncate"
                  style={{
                    fontSize: 13,
                    color: "#666",
                  }}
                >
                  {n.preview}
                </p>
              )}
            </Link>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={createNote}
        disabled={creating}
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
          opacity: creating ? 0.6 : 1,
        }}
      >
        +
      </button>
    </>
  );
}
