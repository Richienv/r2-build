import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type IncomingSection = {
  id?: string;
  heading: string;
  content: string;
  order: number;
  collapsed?: boolean;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { title?: string; sections?: IncomingSection[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() || "Untitled" : undefined;
  const sections = Array.isArray(body.sections) ? body.sections : [];

  const result = await prisma.$transaction(async (tx) => {
    const noteData: { title?: string } = {};
    if (title !== undefined) noteData.title = title;
    const updatedNote = await tx.note.update({ where: { id }, data: noteData });

    const existing = await tx.noteSection.findMany({
      where: { noteId: id },
      select: { id: true },
    });
    const incomingRealIds = new Set(
      sections
        .filter((s) => s.id && !s.id.startsWith("temp-"))
        .map((s) => s.id as string),
    );
    const toDelete = existing
      .map((s) => s.id)
      .filter((sid) => !incomingRealIds.has(sid));
    if (toDelete.length > 0) {
      await tx.noteSection.deleteMany({ where: { id: { in: toDelete } } });
    }

    const savedSections: { clientId: string; id: string }[] = [];
    for (const s of sections) {
      const data = {
        heading: (s.heading ?? "").trim() || "SECTION",
        content: s.content ?? "",
        order: typeof s.order === "number" ? s.order : 0,
        collapsed: !!s.collapsed,
      };
      const clientId = s.id ?? "";
      if (!s.id || s.id.startsWith("temp-")) {
        const created = await tx.noteSection.create({ data: { noteId: id, ...data } });
        savedSections.push({ clientId, id: created.id });
      } else {
        const updated = await tx.noteSection.update({ where: { id: s.id }, data });
        savedSections.push({ clientId, id: updated.id });
      }
    }
    return { updatedAt: updatedNote.updatedAt.toISOString(), sections: savedSections };
  });

  return NextResponse.json({ ok: true, ...result });
}
