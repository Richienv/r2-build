import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayCST } from "@/lib/date";

export const dynamic = "force-dynamic";

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
