import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayCST } from "@/lib/date";

export const dynamic = "force-dynamic";

type ProjectStatus = "BUILDING" | "STUCK" | "WAITING" | "PAUSED" | "DONE";
const VALID_STATUS: ProjectStatus[] = ["BUILDING", "STUCK", "WAITING", "PAUSED", "DONE"];

export async function GET() {
  const today = todayCST();
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    include: {
      focuses: { where: { date: today } },
      milestones: {
        where: { completed: false },
        orderBy: { targetDate: "asc" },
        take: 1,
      },
      blockers: { where: { resolved: false } },
    },
  });
  return NextResponse.json({ projects, today });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name: string;
    status?: ProjectStatus;
    color?: string;
  };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const count = await prisma.project.count();
  if (count >= 6) {
    return NextResponse.json({ error: "Max 6 projects" }, { status: 400 });
  }
  const status: ProjectStatus = VALID_STATUS.includes(body.status as ProjectStatus)
    ? (body.status as ProjectStatus)
    : "BUILDING";
  const color = body.color || "#E8FF47";
  const today = todayCST();
  const project = await prisma.project.create({
    data: {
      name,
      fullName: name,
      color,
      currentPhase: "Getting started",
      status,
      startDate: today,
      order: count,
    },
  });
  return NextResponse.json({ project });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    id: string;
    name?: string;
    status?: ProjectStatus;
    color?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const data: {
    name?: string;
    fullName?: string;
    color?: string;
    status?: ProjectStatus;
  } = {};
  if (body.name?.trim()) {
    data.name = body.name.trim();
    data.fullName = body.name.trim();
  }
  if (body.color) data.color = body.color;
  if (body.status && VALID_STATUS.includes(body.status)) data.status = body.status;
  const project = await prisma.project.update({ where: { id: body.id }, data });
  return NextResponse.json({ project });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
