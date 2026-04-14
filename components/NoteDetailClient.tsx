"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Section = {
  id: string;
  heading: string;
  content: string;
  order: number;
  collapsed: boolean;
};

type Note = {
  id: string;
  title: string;
  sections: Section[];
};

export function NoteDetailClient({ note: initialNote }: { note: Note }) {
  const router = useRouter();
  const [note, setNote] = useState<Note>(initialNote);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveTitle(title: string) {
    if (title === note.title) return;
    setNote((n) => ({ ...n, title }));
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  async function addSection() {
    const order = note.sections.length;
    const res = await fetch(`/api/notes/${note.id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading: "NEW SECTION", content: "", order }),
    });
    const created = await res.json();
    setNote((n) => ({
      ...n,
      sections: [
        ...n.sections,
        {
          id: created.id,
          heading: created.heading,
          content: created.content,
          order: created.order,
          collapsed: created.collapsed,
        },
      ],
    }));
  }

  async function updateSection(
    sectionId: string,
    patch: Partial<Pick<Section, "heading" | "content" | "collapsed">>,
  ) {
    setNote((n) => ({
      ...n,
      sections: n.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    }));
    await fetch(`/api/notes/${note.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sectionId, ...patch }),
    });
  }

  async function deleteSection(sectionId: string) {
    setNote((n) => ({ ...n, sections: n.sections.filter((s) => s.id !== sectionId) }));
    await fetch(`/api/notes/${note.id}/sections?id=${sectionId}`, {
      method: "DELETE",
    });
  }

  async function deleteNote() {
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    router.push("/notes");
  }

  return (
    <>
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 56, borderBottom: "0.5px solid #222" }}
      >
        <Link
          href="/notes"
          className="font-mono text-[14px] btn-press"
          style={{ color: "#444" }}
        >
          ←
        </Link>
        <button
          onClick={() => setConfirmDelete(true)}
          className="btn-press font-mono text-[9px] tracking-[2px]"
          style={{
            color: "#555",
            background: "transparent",
            border: "none",
          }}
        >
          DELETE
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 80 }}>
        <div style={{ padding: "24px 20px" }}>
          <EditableTitle initialValue={note.title} onBlur={saveTitle} />

          <div style={{ height: 1, background: "#222", margin: "20px 0" }} />

          {note.sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onUpdate={(patch) => updateSection(section.id, patch)}
              onDelete={() => deleteSection(section.id)}
            />
          ))}

          <button
            onClick={addSection}
            className="btn-press font-mono uppercase"
            style={{
              fontSize: 10,
              color: "#555",
              background: "transparent",
              border: "none",
              padding: "16px 0",
              letterSpacing: "2px",
            }}
          >
            + ADD SECTION
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setConfirmDelete(false)}
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
              DELETE NOTE?
            </p>
            <p className="font-mono text-[11px] mb-5" style={{ color: "#555" }}>
              This deletes the note and all sections.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
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
                onClick={deleteNote}
                className="flex-1 btn-press font-mono text-[11px] tracking-[3px]"
                style={{
                  height: 48,
                  color: "#FF4747",
                  background: "transparent",
                  border: "1px solid #FF4747",
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EditableTitle({
  initialValue,
  onBlur,
}: {
  initialValue: string;
  onBlur: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onBlur(value.trim() || "Untitled")}
      placeholder="Untitled"
      className="w-full bg-transparent outline-none font-sans"
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: "#F0F0F0",
      }}
    />
  );
}

function SectionEditor({
  section,
  onUpdate,
  onDelete,
}: {
  section: Section;
  onUpdate: (patch: Partial<Pick<Section, "heading" | "content" | "collapsed">>) => void;
  onDelete: () => void;
}) {
  const [heading, setHeading] = useState(section.heading);
  const [content, setContent] = useState(section.content);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate({ collapsed: !section.collapsed })}
          className="btn-press font-mono"
          style={{
            fontSize: 12,
            color: "#E8FF47",
            background: "transparent",
            border: "none",
            padding: 0,
            lineHeight: 1,
          }}
        >
          {section.collapsed ? "▶" : "▼"}
        </button>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          onBlur={() => {
            const trimmed = heading.trim() || "SECTION";
            setHeading(trimmed);
            if (trimmed !== section.heading) onUpdate({ heading: trimmed });
          }}
          className="flex-1 bg-transparent outline-none font-mono uppercase"
          style={{
            fontSize: 11,
            color: "#E8FF47",
            letterSpacing: "2px",
            fontWeight: 500,
          }}
        />
        <button
          onClick={() => setShowDelete((s) => !s)}
          className="btn-press font-mono"
          style={{
            fontSize: 10,
            color: showDelete ? "#FF4747" : "#333",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        >
          {showDelete ? "✕" : "⋯"}
        </button>
      </div>

      {showDelete && (
        <button
          onClick={onDelete}
          className="btn-press font-mono uppercase"
          style={{
            fontSize: 9,
            color: "#FF4747",
            background: "transparent",
            border: "none",
            padding: "4px 0 0 20px",
            letterSpacing: "1.5px",
          }}
        >
          REMOVE SECTION
        </button>
      )}

      {!section.collapsed && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => {
            if (content !== section.content) onUpdate({ content });
          }}
          placeholder="Write here..."
          rows={Math.max(2, content.split("\n").length)}
          className="w-full bg-transparent outline-none font-sans"
          style={{
            fontSize: 14,
            color: "#ccc",
            lineHeight: 1.6,
            marginTop: 8,
            paddingLeft: 20,
            resize: "none",
          }}
        />
      )}
    </div>
  );
}
