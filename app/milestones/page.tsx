import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { MilestonesClient } from "@/components/MilestonesClient";

export const dynamic = "force-dynamic";

export default async function MilestonesPage() {
  const milestones = await prisma.milestone.findMany({
    include: { project: true },
    orderBy: [{ completed: "asc" }, { targetDate: "asc" }],
  });

  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <MilestonesClient
        milestones={milestones.map((m) => ({
          id: m.id,
          title: m.title,
          targetDate: m.targetDate,
          completed: m.completed,
          project: { id: m.project.id, name: m.project.name, color: m.project.color },
        }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
      />
      <BottomNav />
    </main>
  );
}
