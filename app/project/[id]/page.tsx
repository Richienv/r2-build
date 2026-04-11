import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/StatusPill";
import { BottomNav } from "@/components/BottomNav";
import { ProjectTabs } from "@/components/ProjectTabs";
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
      milestones: { orderBy: { targetDate: "asc" } },
      blockers: { orderBy: [{ resolved: "asc" }, { createdAt: "desc" }] },
    },
  });

  if (!project) notFound();

  const todayFocus = project.focuses.find((f) => f.date === today) ?? null;

  return (
    <main className="h-[100dvh] flex flex-col bg-bg text-text overflow-hidden">
      <header
        className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-border"
        style={{ borderBottomColor: project.color }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-accent-dim hover:text-accent text-sm font-mono"
          >
            ←
          </Link>
          <span className="font-display text-xl tracking-wider">{project.name}</span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: project.color }}
          />
        </div>
        <StatusPill status={project.status} />
      </header>

      <ProjectTabs
        project={{
          id: project.id,
          name: project.name,
          color: project.color,
          streak: project.streak,
          fullName: project.fullName,
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

      <BottomNav />
    </main>
  );
}
