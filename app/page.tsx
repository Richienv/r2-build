import { prisma } from "@/lib/prisma";
import { todayCST, weekRangeCST } from "@/lib/date";
import { BottomNav } from "@/components/BottomNav";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayCST();
  const { start: weekStart, end: weekEnd } = weekRangeCST();

  const [projects, weekTasks] = await Promise.all([
    prisma.project.findMany({
      orderBy: { order: "asc" },
      include: {
        focuses: { where: { date: today } },
      },
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: weekStart, lte: weekEnd } },
    }),
  ]);

  const maxStreak = Math.max(0, ...projects.map((p) => p.streak));

  const weekByKey: Record<string, { total: number; done: number }> = {};
  for (const t of weekTasks) {
    const key = t.projectKey ?? "__none__";
    if (!weekByKey[key]) weekByKey[key] = { total: 0, done: 0 };
    weekByKey[key].total += 1;
    if (t.completed) weekByKey[key].done += 1;
  }

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
          weekDone: weekByKey[p.name]?.done ?? 0,
          weekTotal: weekByKey[p.name]?.total ?? 0,
        }))}
        maxStreak={maxStreak}
      />
      <BottomNav />
    </main>
  );
}
