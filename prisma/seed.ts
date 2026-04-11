import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const projects = [
    {
      name: "ERP",
      fullName: "Vertical SaaS ERP",
      color: "#4A9BE8",
      currentPhase: "Finance module QA",
      startDate: "2025-10-01",
      targetDate: "2026-06-30",
      cofounder: "Darren (COO), Raymond (CMO)",
      order: 0,
      focus: "Fix bank reconciliation bug",
      milestones: [
        { title: "Finance module complete", targetDate: "2026-04-20" },
        { title: "Beta launch to 3 SMEs", targetDate: "2026-05-15" },
        { title: "First paid customer", targetDate: "2026-06-30" },
      ],
    },
    {
      name: "OIC",
      fullName: "AI Desk Companion — Digital Karyawan",
      color: "#E8FF47",
      currentPhase: "V3 hardware prototype",
      startDate: "2025-09-01",
      targetDate: "2026-05-20",
      cofounder: null,
      order: 1,
      focus: "Finalize ESP32 pins",
      milestones: [
        { title: "Working prototype", targetDate: "2026-05-01" },
        { title: "创客天下 competition", targetDate: "2026-05-20" },
      ],
    },
    {
      name: "R2·FIT",
      fullName: "Personal fitness app",
      color: "#47FFB8",
      currentPhase: "Week 1 — database & UI build",
      startDate: "2026-04-07",
      targetDate: "2026-04-15",
      cofounder: null,
      order: 2,
      focus: "Add asparagus database",
      milestones: [
        { title: "Full database complete", targetDate: "2026-04-15" },
      ],
    },
  ];

  for (const p of projects) {
    const existing = await prisma.project.findFirst({ where: { name: p.name } });
    if (existing) continue;

    const project = await prisma.project.create({
      data: {
        name: p.name,
        fullName: p.fullName,
        color: p.color,
        currentPhase: p.currentPhase,
        status: "BUILDING",
        streak: 0,
        startDate: p.startDate,
        targetDate: p.targetDate,
        cofounder: p.cofounder,
        order: p.order,
      },
    });

    await prisma.dailyFocus.create({
      data: { projectId: project.id, date: today, task: p.focus },
    });

    for (const m of p.milestones) {
      await prisma.milestone.create({
        data: { projectId: project.id, title: m.title, targetDate: m.targetDate },
      });
    }
  }

  console.log("Seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
