import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { ProjectDetailClient } from "@/components/ProjectDetailClient";
import { todayCST } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = todayCST();
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      focuses: { orderBy: { date: "desc" }, take: 30 },
      milestones: { orderBy: [{ completed: "asc" }, { targetDate: "asc" }] },
      blockers: { orderBy: [{ resolved: "asc" }, { createdAt: "desc" }] },
    },
  });

  if (!project) notFound();
  const hasOpenBlockers = (await prisma.blocker.count({ where: { resolved: false } })) > 0;
  const todayFocus = project.focuses.find((f) => f.date === today) ?? null;

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden slide-in-right" style={{ background: "#080808" }}>
      <ProjectDetailClient
        project={{
          id: project.id,
          name: project.name,
          fullName: project.fullName,
          color: project.color,
          streak: project.streak,
          status: project.status,
          currentPhase: project.currentPhase,
          todayFocus: todayFocus
            ? { id: todayFocus.id, task: todayFocus.task, completed: todayFocus.completed }
            : null,
          history: project.focuses.map((f) => ({
            id: f.id,
            date: f.date,
            task: f.task,
            completed: f.completed,
          })),
          milestones: project.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            targetDate: m.targetDate,
            completed: m.completed,
          })),
          blockers: project.blockers.map((b) => ({
            id: b.id,
            description: b.description,
            reason: b.reason,
            resolved: b.resolved,
            createdAt: b.createdAt.toISOString(),
          })),
        }}
      />
      <BottomNav hasOpenBlockers={hasOpenBlockers} />
    </main>
  );
}
