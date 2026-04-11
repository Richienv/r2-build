import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayCST } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { projectId, task, date } = body as { projectId: string; task: string; date?: string };
  const d = date || todayCST();
  const focus = await prisma.dailyFocus.upsert({
    where: { projectId_date: { projectId, date: d } },
    create: { projectId, date: d, task },
    update: { task },
  });
  return NextResponse.json({ focus });
}

export async function PATCH(req: Request) {
  const { id, completed } = (await req.json()) as { id: string; completed: boolean };
  const focus = await prisma.dailyFocus.update({
    where: { id },
    data: { completed, completedAt: completed ? new Date() : null },
  });

  if (completed) {
    const project = await prisma.project.findUnique({ where: { id: focus.projectId } });
    if (project) {
      await prisma.project.update({
        where: { id: project.id },
        data: { streak: project.streak + 1 },
      });
    }
  }
  return NextResponse.json({ focus });
}
