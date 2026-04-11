import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { BlockerItem } from "@/components/BlockerItem";

export const dynamic = "force-dynamic";

export default async function BlockersPage() {
  const blockers = await prisma.blocker.findMany({
    include: { project: true },
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
  });

  const open = blockers.filter((b) => !b.resolved);

  return (
    <main className="h-[100dvh] flex flex-col bg-bg text-text overflow-hidden">
      <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-border">
        <h1 className="font-display text-2xl tracking-wider">BLOCKERS</h1>
        <p className="text-[11px] font-mono tracking-wider text-accent-dim">
          {open.length} OPEN
        </p>
      </header>

      {open.length === 0 ? (
        <section className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
          <p className="font-display text-4xl tracking-wider text-accent">
            NOTHING BLOCKING YOU.
          </p>
          <p className="font-mono text-xs tracking-widest text-muted">
            SHIP SOMETHING TODAY.
          </p>
        </section>
      ) : (
        <section className="flex-1 overflow-y-auto p-4 space-y-3">
          {blockers.map((b) => (
            <BlockerItem
              key={b.id}
              blocker={{
                id: b.id,
                description: b.description,
                reason: b.reason,
                resolved: b.resolved,
                createdAt: b.createdAt.toISOString(),
                project: { name: b.project.name, color: b.project.color },
              }}
            />
          ))}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
