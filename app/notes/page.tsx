import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { NotesListClient } from "@/components/NotesListClient";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      sections: { orderBy: { order: "asc" }, take: 1 },
    },
  });

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <NotesListClient
        notes={notes.map((n) => ({
          id: n.id,
          title: n.title,
          preview: n.sections[0]?.content?.slice(0, 80) ?? "",
          updatedAt: n.updatedAt.toISOString(),
        }))}
      />
      <BottomNav />
    </main>
  );
}
