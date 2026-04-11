# R2·BUILD

**Ship. Every. Day.** — Project momentum tracker. Part of R2·OS.

## Stack

- Next.js 15 (App Router, React 19)
- Prisma + Neon Postgres
- Tailwind CSS
- Deploy: Vercel

## Setup

```bash
pnpm install   # or npm install
cp .env.example .env   # fill in DATABASE_URL / DIRECT_URL from Neon
pnpm db:push
pnpm db:seed
pnpm dev
```

Open http://localhost:3000

## Deploy

1. Create Neon Postgres project, grab `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
2. `vercel link` then `vercel env add DATABASE_URL` and `DIRECT_URL` (production).
3. `vercel deploy --prod`
4. After first deploy: run `pnpm prisma db push` against production, then `pnpm db:seed`.

## Screens

1. **Home** — 3 project cards, today's focus + streak
2. **Project detail** — Focus / Milestones / Blockers / History tabs
3. **Tasks** — Daily task log across projects
4. **Milestones** — Timeline across projects
5. **Blockers** — Open blockers across projects

## Projects seeded

- **ERP** — Vertical SaaS ERP (`#4A9BE8`)
- **OIC** — AI Desk Companion (`#E8FF47`)
- **R2·FIT** — Personal fitness app (`#47FFB8`)
