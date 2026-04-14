import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await prisma.timelineEvent.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, projectKey, date, type, notes } = body as {
    title: string;
    projectKey: string;
    date: string;
    type: string;
    notes: string | null;
  };

  if (!title?.trim() || !projectKey || !date || !type) {
    return NextResponse.json(
      { error: "title, projectKey, date, type required" },
      { status: 400 },
    );
  }

  const event = await prisma.timelineEvent.create({
    data: {
      title: title.trim(),
      projectKey,
      date: new Date(date),
      type,
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, title, projectKey, date, type, notes } = body as {
    id: string;
    title?: string;
    projectKey?: string;
    date?: string;
    type?: string;
    notes?: string | null;
  };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (projectKey !== undefined) data.projectKey = projectKey;
  if (date !== undefined) data.date = new Date(date);
  if (type !== undefined) data.type = type;
  if (notes !== undefined) data.notes = notes;

  const event = await prisma.timelineEvent.update({ where: { id }, data });
  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.timelineEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
