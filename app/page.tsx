import { prisma } from "@/lib/prisma";
import { todayCST } from "@/lib/date";
import { BottomNav } from "@/components/BottomNav";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayCST();

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({ orderBy: { order: "asc" } }),
    prisma.task.findMany({
      orderBy: [{ dueDate: "asc" }, { dueTime: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const maxStreak = Math.max(0, ...projects.map((p) => p.streak));

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <HomeClient
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          projectKey: t.projectKey,
          dueDate: t.dueDate,
          dueTime: t.dueTime,
          estimatedMinutes: t.estimatedMinutes,
          priority: t.priority,
          completed: t.completed,
        }))}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          color: p.color,
        }))}
        today={today}
        maxStreak={maxStreak}
      />
      <BottomNav />
    </main>
  );
}
