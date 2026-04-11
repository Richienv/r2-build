import { prisma } from "@/lib/prisma";
import { todayCST, formatHeaderDate } from "@/lib/date";
import { ProjectCard } from "@/components/ProjectCard";
import { BottomNav } from "@/components/BottomNav";

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
    },
  });

  const maxStreak = Math.max(0, ...projects.map((p) => p.streak));
  const doneToday = projects.filter((p) => p.focuses[0]?.completed).length;
  const totalToday = projects.filter((p) => p.focuses[0]).length;

  return (
    <main className="h-[100dvh] flex flex-col bg-bg text-text overflow-hidden">
      <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-border">
        <h1 className="font-display text-2xl tracking-wider">R2·BUILD</h1>
        <p className="text-[11px] font-mono tracking-wider text-accent-dim">
          {formatHeaderDate()} · 🔥 {maxStreak} DAY STREAK
        </p>
      </header>

      <section className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-border bg-surface">
        <p className="text-[11px] font-mono tracking-widest text-accent-dim">
          WHAT ARE YOU BUILDING TODAY?
        </p>
        <p className="text-[11px] font-mono tracking-widest text-accent">
          {doneToday}/{totalToday} DONE
        </p>
      </section>

      <section className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p as any} />
        ))}
        {projects.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted font-mono text-sm">
            No projects yet. Run `npm run db:seed`.
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
