import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, projectKey, dueDate, dueTime, estimatedMinutes, priority } = body as {
    title: string;
    projectKey: string | null;
    dueDate: string;
    dueTime?: string | null;
    estimatedMinutes?: number | null;
    priority?: string;
  };

  if (!title?.trim() || !dueDate) {
    return NextResponse.json({ error: "title and dueDate required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      projectKey: projectKey ?? null,
      dueDate,
      dueTime: dueTime ?? null,
      estimatedMinutes: estimatedMinutes ?? null,
      priority: priority || "MEDIUM",
    },
  });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, title, projectKey, dueDate, dueTime, estimatedMinutes, priority, completed } =
    body as {
      id: string;
      title?: string;
      projectKey?: string | null;
      dueDate?: string;
      dueTime?: string | null;
      estimatedMinutes?: number | null;
      priority?: string;
      completed?: boolean;
    };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (projectKey !== undefined) data.projectKey = projectKey;
  if (dueDate !== undefined) data.dueDate = dueDate;
  if (dueTime !== undefined) data.dueTime = dueTime;
  if (estimatedMinutes !== undefined) data.estimatedMinutes = estimatedMinutes;
  if (priority !== undefined) data.priority = priority;
  if (completed !== undefined) {
    data.completed = completed;
    data.completedAt = completed ? new Date() : null;
  }

  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
