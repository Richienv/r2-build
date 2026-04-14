"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
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
  updatedAt: string;
  sections: Section[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error" | "unsaved";

const draftKey = (id: string) => `note_draft_${id}`;

const SAVE_DEBOUNCE_MS = 800;
const SAVED_FADE_MS = 2000;
const UNDO_TOAST_MS = 5000;

export function NoteDetailClient({ note: initialNote }: { note: Note }) {
  const router = useRouter();

  const [{ note: hydratedNote, recovered }] = useState(() => {
    if (typeof window === "undefined") {
      return { note: initialNote, recovered: false };
    }
    try {
      const raw = window.localStorage.getItem(draftKey(initialNote.id));
      if (!raw) return { note: initialNote, recovered: false };
      const parsed = JSON.parse(raw) as Note & { savedAt?: string };
      const draftTime = parsed.savedAt ? Date.parse(parsed.savedAt) : 0;
      const dbTime = Date.parse(initialNote.updatedAt) || 0;
      if (draftTime > dbTime && parsed.id === initialNote.id) {
        return { note: { ...parsed, updatedAt: initialNote.updatedAt }, recovered: true };
      }
      window.localStorage.removeItem(draftKey(initialNote.id));
      return { note: initialNote, recovered: false };
    } catch {
      return { note: initialNote, recovered: false };
    }
  });

  const [note, setNote] = useState<Note>(hydratedNote);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    recovered ? "unsaved" : "idle",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [undoToast, setUndoToast] = useState<{ section: Section } | null>(null);

  const noteRef = useRef(note);
  noteRef.current = note;
  const recoveredRef = useRef(recovered);

  const dirtyTitleRef = useRef(false);
  const dirtySectionsRef = useRef<Set<string>>(new Set());
  const pendingCreatesRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoStackRef = useRef<Section[]>([]);
  const textareaRefsRef = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const flush = useCallback(async () => {
    const current = noteRef.current;
    const jobs: Promise<Response>[] = [];

    if (dirtyTitleRef.current) {
      dirtyTitleRef.current = false;
      jobs.push(
        fetch(`/api/notes/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: current.title }),
        }),
      );
    }

    const dirtyIds = Array.from(dirtySectionsRef.current);
    dirtySectionsRef.current.clear();
    for (const id of dirtyIds) {
      if (id.startsWith("temp-")) continue;
      const s = current.sections.find((x) => x.id === id);
      if (!s) continue;
      jobs.push(
        fetch(`/api/notes/${current.id}/sections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: s.id,
            heading: s.heading,
            content: s.content,
            order: s.order,
            collapsed: s.collapsed,
          }),
        }),
      );
    }

    if (jobs.length === 0) {
      setSaveStatus("idle");
      return;
    }

    try {
      const results = await Promise.all(jobs);
      const ok = results.every((r) => r.ok);
      if (!ok) throw new Error("save failed");
      if (
        dirtyTitleRef.current === false &&
        dirtySectionsRef.current.size === 0 &&
        pendingCreatesRef.current.size === 0
      ) {
        try {
          window.localStorage.removeItem(draftKey(current.id));
        } catch {}
      }
      setSaveStatus("saved");
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
      savedFadeTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, SAVED_FADE_MS);
    } catch {
      setSaveStatus("error");
    }
  }, []);

  const scheduleSave = useCallback(() => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void flush();
    }, SAVE_DEBOUNCE_MS);
  }, [flush]);

  const flushNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await flush();
  }, [flush]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const draft = {
        ...note,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(draftKey(note.id), JSON.stringify(draft));
    } catch {}
  }, [note]);

  useEffect(() => {
    const beaconSave = () => {
      const current = noteRef.current;
      const hasPending =
        dirtyTitleRef.current ||
        dirtySectionsRef.current.size > 0 ||
        pendingCreatesRef.current.size > 0;
      if (!hasPending) return;
      const body = JSON.stringify({
        title: current.title,
        sections: current.sections.map((s) => ({
          id: s.id,
          heading: s.heading,
          content: s.content,
          order: s.order,
          collapsed: s.collapsed,
        })),
      });
      try {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(`/api/notes/${current.id}/save`, blob);
      } catch {
        void flush();
      }
    };

    const handleBeforeUnload = () => beaconSave();
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") beaconSave();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
      if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recoveredRef.current) return;
    recoveredRef.current = false;
    const current = noteRef.current;
    setSaveStatus("saving");
    (async () => {
      try {
        const res = await fetch(`/api/notes/${current.id}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: current.title,
            sections: current.sections.map((s) => ({
              id: s.id,
              heading: s.heading,
              content: s.content,
              order: s.order,
              collapsed: s.collapsed,
            })),
          }),
        });
        if (!res.ok) throw new Error("recover save failed");
        const json = (await res.json()) as {
          sections: { clientId: string; id: string }[];
        };
        const idMap = new Map(json.sections.map((s) => [s.clientId, s.id]));
        setNote((n) => ({
          ...n,
          sections: n.sections.map((s) => {
            const real = idMap.get(s.id);
            if (!real || real === s.id) return s;
            const oldRef = textareaRefsRef.current[s.id];
            if (oldRef) {
              textareaRefsRef.current[real] = oldRef;
              delete textareaRefsRef.current[s.id];
            }
            return { ...s, id: real };
          }),
        }));
        try {
          window.localStorage.removeItem(draftKey(current.id));
        } catch {}
        dirtyTitleRef.current = false;
        dirtySectionsRef.current.clear();
        setSaveStatus("saved");
        if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
        savedFadeTimerRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_FADE_MS);
      } catch {
        setSaveStatus("error");
      }
    })();
  }, []);

  const updateTitle = useCallback(
    (title: string) => {
      setNote((n) => ({ ...n, title }));
      dirtyTitleRef.current = true;
      scheduleSave();
    },
    [scheduleSave],
  );

  const updateSectionContent = useCallback(
    (id: string, content: string) => {
      setNote((n) => ({
        ...n,
        sections: n.sections.map((s) => (s.id === id ? { ...s, content } : s)),
      }));
      dirtySectionsRef.current.add(id);
      scheduleSave();
    },
    [scheduleSave],
  );

  const updateSectionHeading = useCallback(
    (id: string, heading: string) => {
      setNote((n) => ({
        ...n,
        sections: n.sections.map((s) => (s.id === id ? { ...s, heading } : s)),
      }));
      dirtySectionsRef.current.add(id);
      scheduleSave();
    },
    [scheduleSave],
  );

  const toggleCollapsed = useCallback(
    (id: string) => {
      setNote((n) => ({
        ...n,
        sections: n.sections.map((s) =>
          s.id === id ? { ...s, collapsed: !s.collapsed } : s,
        ),
      }));
      dirtySectionsRef.current.add(id);
      scheduleSave();
    },
    [scheduleSave],
  );

  const focusSection = useCallback((id: string, cursor: "start" | "end" = "end") => {
    requestAnimationFrame(() => {
      const el = textareaRefsRef.current[id];
      if (!el) return;
      el.focus();
      const pos = cursor === "start" ? 0 : el.value.length;
      el.setSelectionRange(pos, pos);
    });
  }, []);

  const addSectionAfter = useCallback(
    (afterId: string | null, initialHeading = "SECTION") => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const current = noteRef.current;
      const idx =
        afterId === null
          ? current.sections.length
          : current.sections.findIndex((s) => s.id === afterId) + 1;
      const newSection: Section = {
        id: tempId,
        heading: initialHeading,
        content: "",
        order: idx,
        collapsed: false,
      };
      const nextSections = [
        ...current.sections.slice(0, idx),
        newSection,
        ...current.sections.slice(idx).map((s) => ({ ...s, order: s.order + 1 })),
      ];
      flushSync(() => {
        setNote({ ...current, sections: nextSections });
      });
      pendingCreatesRef.current.add(tempId);
      setSaveStatus("saving");

      (async () => {
        try {
          const res = await fetch(`/api/notes/${current.id}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              heading: newSection.heading,
              content: newSection.content,
              order: newSection.order,
            }),
          });
          if (!res.ok) throw new Error("create failed");
          const created = await res.json();
          pendingCreatesRef.current.delete(tempId);
          setNote((n) => ({
            ...n,
            sections: n.sections.map((s) =>
              s.id === tempId
                ? {
                    id: created.id,
                    heading: created.heading,
                    content: created.content,
                    order: created.order,
                    collapsed: created.collapsed ?? false,
                  }
                : s,
            ),
          }));
          const oldRef = textareaRefsRef.current[tempId];
          if (oldRef) {
            textareaRefsRef.current[created.id] = oldRef;
            delete textareaRefsRef.current[tempId];
          }
          if (
            dirtyTitleRef.current === false &&
            dirtySectionsRef.current.size === 0 &&
            pendingCreatesRef.current.size === 0
          ) {
            setSaveStatus("saved");
            if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
            savedFadeTimerRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_FADE_MS);
          }
        } catch {
          pendingCreatesRef.current.delete(tempId);
          setSaveStatus("error");
        }
      })();

      focusSection(tempId, "start");
      return tempId;
    },
    [focusSection],
  );

  const deleteSection = useCallback(
    (id: string) => {
      const current = noteRef.current;
      const section = current.sections.find((s) => s.id === id);
      if (!section) return;
      undoStackRef.current.push(section);
      setNote({
        ...current,
        sections: current.sections
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, order: i })),
      });
      dirtySectionsRef.current.delete(id);
      delete textareaRefsRef.current[id];

      if (!id.startsWith("temp-")) {
        setSaveStatus("saving");
        fetch(`/api/notes/${current.id}/sections?id=${id}`, {
          method: "DELETE",
        })
          .then(() => {
            setSaveStatus("saved");
            if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
            savedFadeTimerRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_FADE_MS);
          })
          .catch(() => setSaveStatus("error"));
      }

      setUndoToast({ section });
      if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);
      undoToastTimerRef.current = setTimeout(() => {
        setUndoToast(null);
        undoStackRef.current = [];
      }, UNDO_TOAST_MS);
    },
    [],
  );

  const undoLastDelete = useCallback(() => {
    const last = undoStackRef.current.pop();
    if (!last) return;
    const current = noteRef.current;
    const idx = Math.min(last.order, current.sections.length);
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const restored: Section = { ...last, id: tempId };
    const nextSections = [
      ...current.sections.slice(0, idx),
      restored,
      ...current.sections.slice(idx).map((s) => ({ ...s, order: s.order + 1 })),
    ];
    setNote({ ...current, sections: nextSections });
    pendingCreatesRef.current.add(tempId);
    setSaveStatus("saving");
    setUndoToast(null);
    if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);

    (async () => {
      try {
        const res = await fetch(`/api/notes/${current.id}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heading: restored.heading,
            content: restored.content,
            order: restored.order,
          }),
        });
        if (!res.ok) throw new Error("restore failed");
        const created = await res.json();
        pendingCreatesRef.current.delete(tempId);
        setNote((n) => ({
          ...n,
          sections: n.sections.map((s) =>
            s.id === tempId
              ? {
                  id: created.id,
                  heading: created.heading,
                  content: created.content,
                  order: created.order,
                  collapsed: created.collapsed ?? false,
                }
              : s,
          ),
        }));
        setSaveStatus("saved");
        if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
        savedFadeTimerRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_FADE_MS);
      } catch {
        pendingCreatesRef.current.delete(tempId);
        setSaveStatus("error");
      }
    })();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        const inField =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            (target as HTMLElement).isContentEditable);
        if (!inField && undoStackRef.current.length > 0) {
          e.preventDefault();
          undoLastDelete();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undoLastDelete]);

  const registerTextarea = useCallback(
    (id: string) => (el: HTMLTextAreaElement | null) => {
      if (el) textareaRefsRef.current[id] = el;
      else delete textareaRefsRef.current[id];
    },
    [],
  );

  const focusNext = useCallback((fromId: string) => {
    const current = noteRef.current;
    const i = current.sections.findIndex((s) => s.id === fromId);
    if (i === -1 || i === current.sections.length - 1) return false;
    const nextId = current.sections[i + 1].id;
    const next = current.sections[i + 1];
    if (next.collapsed) {
      flushSync(() => {
        setNote((n) => ({
          ...n,
          sections: n.sections.map((s) =>
            s.id === nextId ? { ...s, collapsed: false } : s,
          ),
        }));
      });
      dirtySectionsRef.current.add(nextId);
    }
    focusSection(nextId, "start");
    return true;
  }, [focusSection]);

  const focusPrev = useCallback((fromId: string) => {
    const current = noteRef.current;
    const i = current.sections.findIndex((s) => s.id === fromId);
    if (i <= 0) return false;
    const prevId = current.sections[i - 1].id;
    const prev = current.sections[i - 1];
    if (prev.collapsed) {
      flushSync(() => {
        setNote((n) => ({
          ...n,
          sections: n.sections.map((s) =>
            s.id === prevId ? { ...s, collapsed: false } : s,
          ),
        }));
      });
      dirtySectionsRef.current.add(prevId);
    }
    focusSection(prevId, "end");
    return true;
  }, [focusSection]);

  const deleteNote = useCallback(async () => {
    await flushNow();
    await fetch(`/api/notes/${noteRef.current.id}`, { method: "DELETE" });
    router.push("/notes");
  }, [flushNow, router]);

  const useDefaultValue = note.sections.length > 10;

  return (
    <>
      <header
        className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 56, borderBottom: "0.5px solid #222" }}
      >
        <Link
          href="/notes"
          className="font-mono text-[14px] btn-press"
          style={{ color: "#444" }}
          onClick={() => void flushNow()}
        >
          ←
        </Link>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
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
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 80 }}>
        <div style={{ padding: "24px 20px" }}>
          <EditableTitle value={note.title} onChange={updateTitle} />

          <div style={{ height: 1, background: "#222", margin: "20px 0" }} />

          {note.sections.map((section, idx) => (
            <NoteSectionRow
              key={section.id}
              sectionId={section.id}
              heading={section.heading}
              content={section.content}
              collapsed={section.collapsed}
              isLast={idx === note.sections.length - 1}
              useDefaultValue={useDefaultValue}
              registerTextarea={registerTextarea}
              onHeadingChange={updateSectionHeading}
              onContentChange={updateSectionContent}
              onToggleCollapsed={toggleCollapsed}
              onDelete={deleteSection}
              onAddAfter={addSectionAfter}
              onFocusNext={focusNext}
              onFocusPrev={focusPrev}
            />
          ))}

          <button
            onClick={() => addSectionAfter(null)}
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

      {undoToast && (
        <div
          className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
          style={{ bottom: 88 }}
        >
          <div
            className="pointer-events-auto flex items-center gap-3"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              padding: "10px 14px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: "#888", letterSpacing: "1.5px" }}
            >
              SECTION DELETED
            </span>
            <button
              onClick={undoLastDelete}
              className="btn-press font-mono uppercase"
              style={{
                fontSize: 10,
                color: "#E8FF47",
                background: "transparent",
                border: "none",
                padding: 0,
                letterSpacing: "1.5px",
              }}
            >
              UNDO
            </button>
          </div>
        </div>
      )}

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

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label = useMemo(() => {
    switch (status) {
      case "saving":
        return "saving…";
      case "saved":
        return "saved ✓";
      case "error":
        return "⚠ not saved";
      case "unsaved":
        return "● DRAFT";
      default:
        return "";
    }
  }, [status]);

  if (status === "idle") return <span style={{ width: 56 }} />;

  const color =
    status === "error"
      ? "#FF4747"
      : status === "saved"
        ? "#E8FF47"
        : status === "unsaved"
          ? "#E8FF47"
          : "#666";

  return (
    <span
      className="font-mono"
      style={{
        fontSize: 10,
        color,
        letterSpacing: "0.5px",
        minWidth: 56,
        textAlign: "right",
        transition: "color 200ms ease",
      }}
    >
      {label}
    </span>
  );
}

function EditableTitle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        const trimmed = e.target.value.trim() || "Untitled";
        if (trimmed !== e.target.value) onChange(trimmed);
      }}
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

type NoteSectionRowProps = {
  sectionId: string;
  heading: string;
  content: string;
  collapsed: boolean;
  isLast: boolean;
  useDefaultValue: boolean;
  registerTextarea: (id: string) => (el: HTMLTextAreaElement | null) => void;
  onHeadingChange: (id: string, heading: string) => void;
  onContentChange: (id: string, content: string) => void;
  onToggleCollapsed: (id: string) => void;
  onDelete: (id: string) => void;
  onAddAfter: (afterId: string | null, initialHeading?: string) => string;
  onFocusNext: (id: string) => boolean;
  onFocusPrev: (id: string) => boolean;
};

const NoteSectionRow = memo(function NoteSectionRow({
  sectionId,
  heading,
  content,
  collapsed,
  isLast,
  useDefaultValue,
  registerTextarea,
  onHeadingChange,
  onContentChange,
  onToggleCollapsed,
  onDelete,
  onAddAfter,
  onFocusNext,
  onFocusPrev,
}: NoteSectionRowProps) {
  const [showDelete, setShowDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      textareaRef.current = el;
      registerTextarea(sectionId)(el);
      if (el) autoResize(el);
    },
    [registerTextarea, sectionId],
  );

  useEffect(() => {
    if (!useDefaultValue && textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [content, useDefaultValue]);

  const handleContentInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onContentChange(sectionId, e.target.value);
      autoResize(e.target);
    },
    [onContentChange, sectionId],
  );

  const handleContentInputUncontrolled = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      onContentChange(sectionId, el.value);
      autoResize(el);
    },
    [onContentChange, sectionId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapSelection(el, "**", "**");
        onContentChange(sectionId, el.value);
        return;
      }
      if (meta && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapSelection(el, "*", "*");
        onContentChange(sectionId, el.value);
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const start = el.selectionStart;
        const end = el.selectionEnd;
        if (e.shiftKey) {
          const lineStart = el.value.lastIndexOf("\n", start - 1) + 1;
          if (el.value.slice(lineStart, lineStart + 2) === "  ") {
            el.value = el.value.slice(0, lineStart) + el.value.slice(lineStart + 2);
            el.selectionStart = el.selectionEnd = Math.max(lineStart, start - 2);
            onContentChange(sectionId, el.value);
            autoResize(el);
          }
        } else {
          el.value = el.value.slice(0, start) + "  " + el.value.slice(end);
          el.selectionStart = el.selectionEnd = start + 2;
          onContentChange(sectionId, el.value);
          autoResize(el);
        }
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const value = el.value;
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const currentLine = value.slice(lineStart, start);

        const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
        const bulletMatch = currentLine.match(/^(\s*)([-*•])\s(.*)$/);

        if (numberedMatch) {
          const [, indent, num, rest] = numberedMatch;
          if (rest === "") {
            e.preventDefault();
            const newValue =
              value.slice(0, lineStart) + value.slice(start);
            el.value = newValue;
            el.selectionStart = el.selectionEnd = lineStart;
            onContentChange(sectionId, newValue);
            autoResize(el);
            return;
          }
          e.preventDefault();
          const nextNum = parseInt(num, 10) + 1;
          const insert = `\n${indent}${nextNum}. `;
          const newValue = value.slice(0, start) + insert + value.slice(end);
          el.value = newValue;
          el.selectionStart = el.selectionEnd = start + insert.length;
          onContentChange(sectionId, newValue);
          autoResize(el);
          return;
        }

        if (bulletMatch) {
          const [, indent, marker, rest] = bulletMatch;
          if (rest === "") {
            e.preventDefault();
            const newValue = value.slice(0, lineStart) + value.slice(start);
            el.value = newValue;
            el.selectionStart = el.selectionEnd = lineStart;
            onContentChange(sectionId, newValue);
            autoResize(el);
            return;
          }
          e.preventDefault();
          const insert = `\n${indent}${marker} `;
          const newValue = value.slice(0, start) + insert + value.slice(end);
          el.value = newValue;
          el.selectionStart = el.selectionEnd = start + insert.length;
          onContentChange(sectionId, newValue);
          autoResize(el);
          return;
        }

        const endsDoubleNewline =
          start >= 2 && value.slice(start - 2, start) === "\n\n";
        const atEndOfContent = start === value.length;
        if (endsDoubleNewline && atEndOfContent) {
          e.preventDefault();
          const trimmed = value.replace(/\n+$/, "");
          el.value = trimmed;
          onContentChange(sectionId, trimmed);
          autoResize(el);
          if (isLast) {
            onAddAfter(sectionId);
          } else {
            onFocusNext(sectionId);
          }
          return;
        }
      }

      if (e.key === "Backspace") {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        if (start === 0 && end === 0 && el.value === "") {
          e.preventDefault();
          if (!onFocusPrev(sectionId)) {
            // nothing before — leave as is
            return;
          }
          onDelete(sectionId);
          return;
        }
      }

      if (e.key === "ArrowUp") {
        const start = el.selectionStart;
        const firstNewline = el.value.indexOf("\n");
        const onFirstLine = firstNewline === -1 || start <= firstNewline;
        if (onFirstLine) {
          if (onFocusPrev(sectionId)) e.preventDefault();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        const start = el.selectionStart;
        const lastNewline = el.value.lastIndexOf("\n");
        const onLastLine = lastNewline === -1 || start > lastNewline;
        if (onLastLine) {
          if (onFocusNext(sectionId)) e.preventDefault();
        }
        return;
      }
    },
    [
      isLast,
      onAddAfter,
      onContentChange,
      onDelete,
      onFocusNext,
      onFocusPrev,
      sectionId,
    ],
  );

  const handleHeadingKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(0, 0);
        }
      }
    },
    [],
  );

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleCollapsed(sectionId)}
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
          {collapsed ? "▶" : "▼"}
        </button>
        <input
          value={heading}
          onChange={(e) => onHeadingChange(sectionId, e.target.value)}
          onBlur={(e) => {
            const trimmed = e.target.value.trim() || "SECTION";
            if (trimmed !== e.target.value) onHeadingChange(sectionId, trimmed);
          }}
          onKeyDown={handleHeadingKeyDown}
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
          onClick={() => {
            setShowDelete(false);
            onDelete(sectionId);
          }}
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

      <div style={{ display: collapsed ? "none" : "block" }}>
        {useDefaultValue ? (
          <textarea
            ref={setRef}
            defaultValue={content}
            onInput={handleContentInputUncontrolled}
            onKeyDown={handleKeyDown}
            placeholder="Write here…"
            className="w-full bg-transparent outline-none font-sans"
            style={{
              fontSize: 14,
              color: "#ccc",
              lineHeight: 1.6,
              marginTop: 8,
              paddingLeft: 20,
              resize: "none",
              minHeight: 32,
            }}
          />
        ) : (
          <textarea
            ref={setRef}
            value={content}
            onChange={handleContentInput}
            onKeyDown={handleKeyDown}
            placeholder="Write here…"
            className="w-full bg-transparent outline-none font-sans"
            style={{
              fontSize: 14,
              color: "#ccc",
              lineHeight: 1.6,
              marginTop: 8,
              paddingLeft: 20,
              resize: "none",
              minHeight: 32,
            }}
          />
        )}
      </div>
    </div>
  );
});

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function wrapSelection(el: HTMLTextAreaElement, open: string, close: string) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = el.value.slice(0, start);
  const selected = el.value.slice(start, end);
  const after = el.value.slice(end);
  el.value = `${before}${open}${selected}${close}${after}`;
  if (selected.length === 0) {
    const pos = start + open.length;
    el.selectionStart = el.selectionEnd = pos;
  } else {
    el.selectionStart = start + open.length;
    el.selectionEnd = end + open.length;
  }
}
