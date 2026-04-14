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
      blockers: { where: { resolved: false }, take: 1 },
    },
  });

  const maxStreak = Math.max(0, ...projects.map((p) => p.streak));
  const blockerProject = projects.find((p) => p.blockers.length > 0);

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <HomeClient
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          color: p.color,
          focus: p.focuses[0]
            ? { id: p.focuses[0].id, task: p.focuses[0].task, completed: p.focuses[0].completed }
            : null,
        }))}
        maxStreak={maxStreak}
        blockerProjectName={blockerProject?.name ?? null}
      />
      <BottomNav />
    </main>
  );
}
