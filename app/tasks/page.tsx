import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { todayCST } from "@/lib/date";
import { TasksClient } from "@/components/TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const today = todayCST();

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <TasksClient
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          projectKey: t.projectKey,
          dueDate: t.dueDate,
          priority: t.priority,
          completed: t.completed,
        }))}
        projects={projects.map((p) => ({ name: p.name, color: p.color }))}
        today={today}
      />
      <BottomNav />
    </main>
  );
}
