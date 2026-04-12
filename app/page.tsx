import { prisma } from "@/lib/prisma";
import { todayCST } from "@/lib/date";
import { BottomNav } from "@/components/BottomNav";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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

  const hasOpenBlockers = projects.some((p) => p.blockers.length > 0);
  const maxStreak = Math.max(0, ...projects.map((p) => p.streak));

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <HomeClient
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          fullName: p.fullName,
          color: p.color,
          currentPhase: p.currentPhase,
          status: p.status,
          streak: p.streak,
          focuses: p.focuses.map((f) => ({ id: f.id, task: f.task, completed: f.completed })),
          milestones: p.milestones.map((m) => ({ id: m.id, title: m.title, targetDate: m.targetDate })),
        }))}
        maxStreak={maxStreak}
      />
      <BottomNav hasOpenBlockers={hasOpenBlockers} />
    </main>
  );
}
