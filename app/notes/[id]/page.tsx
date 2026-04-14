import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { NoteDetailClient } from "@/components/NoteDetailClient";

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!note) notFound();

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#080808" }}>
      <NoteDetailClient
        note={{
          id: note.id,
          title: note.title,
          updatedAt: note.updatedAt.toISOString(),
          sections: note.sections.map((s) => ({
            id: s.id,
            heading: s.heading,
            content: s.content,
            order: s.order,
            collapsed: s.collapsed,
          })),
        }}
      />
    </main>
  );
}
