import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const blockers = await prisma.blocker.findMany({
    include: { project: true },
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ blockers });
}

export async function POST(req: Request) {
  const { projectId, description, reason } = (await req.json()) as {
    projectId: string;
    description: string;
    reason: string;
  };
  const blocker = await prisma.blocker.create({
    data: { projectId, description, reason },
  });
  await prisma.project.update({ where: { id: projectId }, data: { status: "STUCK" } });
  return NextResponse.json({ blocker });
}

export async function PATCH(req: Request) {
  const { id, resolved } = (await req.json()) as { id: string; resolved: boolean };
  const blocker = await prisma.blocker.update({
    where: { id },
    data: { resolved, resolvedAt: resolved ? new Date() : null },
  });
  if (resolved) {
    const openCount = await prisma.blocker.count({
      where: { projectId: blocker.projectId, resolved: false },
    });
    if (openCount === 0) {
      await prisma.project.update({
        where: { id: blocker.projectId },
        data: { status: "BUILDING" },
      });
    }
  }
  return NextResponse.json({ blocker });
}
