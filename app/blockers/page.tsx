import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { BlockersClient } from "@/components/BlockersClient";

export const dynamic = "force-dynamic";

export default async function BlockersPage() {
  const blockers = await prisma.blocker.findMany({
    include: { project: true },
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
  });

  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  const hasOpenBlockers = blockers.some((b) => !b.resolved);

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <BlockersClient
        blockers={blockers.map((b) => ({
          id: b.id,
          description: b.description,
          reason: b.reason,
          resolved: b.resolved,
          createdAt: b.createdAt.toISOString(),
          project: { id: b.project.id, name: b.project.name, color: b.project.color },
        }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
        hasOpenBlockers={hasOpenBlockers}
      />
      <BottomNav />
    </main>
  );
}
