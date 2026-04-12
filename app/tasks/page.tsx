import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { todayCST } from "@/lib/date";
import { TasksClient } from "@/components/TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const today = todayCST();
  const focuses = await prisma.dailyFocus.findMany({
    include: { project: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  const hasOpenBlockers = (await prisma.blocker.count({ where: { resolved: false } })) > 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);
  const weekFocuses = focuses.filter((f) => f.date >= weekStr);
  const weekDone = weekFocuses.filter((f) => f.completed).length;
  const pct = weekFocuses.length ? Math.round((weekDone / weekFocuses.length) * 100) : 0;

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <TasksClient
        focuses={focuses.map((f) => ({
          id: f.id,
          date: f.date,
          task: f.task,
          completed: f.completed,
          project: { name: f.project.name, color: f.project.color },
        }))}
        projects={projects.map((p) => ({ name: p.name, color: p.color }))}
        today={today}
        weekDone={weekDone}
        weekTotal={weekFocuses.length}
        weekPct={pct}
      />
      <BottomNav hasOpenBlockers={hasOpenBlockers} />
    </main>
  );
}
