import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { formatMilestoneDate } from "@/lib/date";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function MilestonesPage() {
  const milestones = await prisma.milestone.findMany({
    include: { project: true },
    orderBy: [{ completed: "asc" }, { targetDate: "asc" }],
  });

  return (
    <main className="h-[100dvh] flex flex-col bg-bg text-text overflow-hidden">
      <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-border">
        <h1 className="font-display text-2xl tracking-wider">MILESTONES</h1>
        <p className="text-[11px] font-mono tracking-wider text-accent-dim">
          {milestones.filter((m) => !m.completed).length} UPCOMING
        </p>
      </header>

      <section className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-border/60">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-4 px-5 py-4">
              <span
                className={clsx(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  m.completed ? "bg-done" : ""
                )}
                style={!m.completed ? { backgroundColor: m.project.color } : undefined}
              />
              <span
                className="font-mono text-[11px] w-14 shrink-0 tracking-wider"
                style={{ color: m.project.color }}
              >
                {m.project.name}
              </span>
              <span
                className={clsx(
                  "flex-1 text-sm truncate",
                  m.completed ? "text-muted line-through" : "text-text"
                )}
              >
                {m.title}
              </span>
              <span className="font-mono text-[11px] text-accent-dim tracking-wider shrink-0">
                {formatMilestoneDate(m.targetDate)}
              </span>
            </li>
          ))}
          {milestones.length === 0 && (
            <li className="px-5 py-8 text-center text-muted font-mono text-sm">
              No milestones set.
            </li>
          )}
        </ul>
      </section>

      <BottomNav />
    </main>
  );
}
