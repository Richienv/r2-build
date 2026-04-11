import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { todayCST } from "@/lib/date";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const focuses = await prisma.dailyFocus.findMany({
    include: { project: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const today = todayCST();
  const now = new Date(today);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);
  const weekFocuses = focuses.filter((f) => f.date >= weekStr);
  const weekDone = weekFocuses.filter((f) => f.completed).length;
  const pct = weekFocuses.length ? Math.round((weekDone / weekFocuses.length) * 100) : 0;

  const groups = focuses.reduce<Record<string, typeof focuses>>((acc, f) => {
    (acc[f.date] ??= []).push(f);
    return acc;
  }, {});

  function labelFor(date: string) {
    if (date === today) return "TODAY";
    const d = new Date(date);
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (date === y.toISOString().slice(0, 10)) return "YESTERDAY";
    return d.toDateString().toUpperCase();
  }

  return (
    <main className="h-[100dvh] flex flex-col bg-bg text-text overflow-hidden">
      <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-border">
        <h1 className="font-display text-2xl tracking-wider">TASK LOG</h1>
        <p className="text-[11px] font-mono tracking-wider text-accent-dim">
          THIS WEEK · {weekDone}/{weekFocuses.length} · {pct}%
        </p>
      </header>

      <section className="flex-1 overflow-y-auto">
        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="px-5 py-2 border-b border-border bg-surface sticky top-0">
              <p className="text-[10px] font-mono tracking-widest text-muted">
                ── {labelFor(date)} ──
              </p>
            </div>
            <ul>
              {items.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-border/60"
                >
                  <span
                    className={clsx(
                      "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0",
                      f.completed
                        ? "bg-done/20 border-done/60 text-done"
                        : "border-muted text-muted"
                    )}
                  >
                    {f.completed ? "✓" : "○"}
                  </span>
                  <span
                    className="font-mono text-[11px] w-14 shrink-0 tracking-wider"
                    style={{ color: f.project.color }}
                  >
                    {f.project.name}
                  </span>
                  <span
                    className={clsx(
                      "text-sm flex-1 truncate",
                      f.completed ? "text-text" : "text-accent-dim"
                    )}
                  >
                    {f.task}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {focuses.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted font-mono text-sm">
            No tasks yet.
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
