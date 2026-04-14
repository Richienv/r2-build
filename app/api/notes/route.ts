import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled";
  const note = await prisma.note.create({ data: { title } });
  return NextResponse.json(note);
}
