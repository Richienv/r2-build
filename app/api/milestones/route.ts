import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const milestones = await prisma.milestone.findMany({
    include: { project: true },
    orderBy: { targetDate: "asc" },
  });
  return NextResponse.json({ milestones });
}

export async function POST(req: Request) {
  const { projectId, title, targetDate } = (await req.json()) as {
    projectId: string;
    title: string;
    targetDate: string;
  };
  const milestone = await prisma.milestone.create({
    data: { projectId, title, targetDate },
  });
  return NextResponse.json({ milestone });
}

export async function PATCH(req: Request) {
  const { id, completed } = (await req.json()) as { id: string; completed: boolean };
  const milestone = await prisma.milestone.update({
    where: { id },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  return NextResponse.json({ milestone });
}
