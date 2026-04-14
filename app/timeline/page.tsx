import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { todayCST } from "@/lib/date";
import { TimelineClient } from "@/components/TimelineClient";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const [events, projects] = await Promise.all([
    prisma.timelineEvent.findMany({ orderBy: { date: "asc" } }),
    prisma.project.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <TimelineClient
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          projectKey: e.projectKey,
          date: e.date.toISOString(),
          type: e.type,
          notes: e.notes,
        }))}
        projects={projects.map((p) => ({ name: p.name, color: p.color }))}
        today={todayCST()}
      />
      <BottomNav />
    </main>
  );
}
