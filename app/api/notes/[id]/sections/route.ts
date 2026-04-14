import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: noteId } = await params;
  const body = await req.json();
  const { heading, content, order } = body as {
    heading: string;
    content: string;
    order: number;
  };

  const section = await prisma.noteSection.create({
    data: {
      noteId,
      heading: heading?.trim() || "SECTION",
      content: content ?? "",
      order: typeof order === "number" ? order : 0,
    },
  });

  await prisma.note.update({
    where: { id: noteId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(section);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: noteId } = await params;
  const body = await req.json();
  const { id, heading, content, order, collapsed } = body as {
    id: string;
    heading?: string;
    content?: string;
    order?: number;
    collapsed?: boolean;
  };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (heading !== undefined) data.heading = heading;
  if (content !== undefined) data.content = content;
  if (order !== undefined) data.order = order;
  if (collapsed !== undefined) data.collapsed = collapsed;

  const section = await prisma.noteSection.update({ where: { id }, data });

  await prisma.note.update({
    where: { id: noteId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(section);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: noteId } = await params;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.noteSection.delete({ where: { id } });

  await prisma.note.update({
    where: { id: noteId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
