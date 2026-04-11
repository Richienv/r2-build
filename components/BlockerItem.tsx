"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { formatMilestoneDate } from "@/lib/date";

type Blocker = {
  id: string;
  description: string;
  reason: string;
  resolved: boolean;
  createdAt: string;
  project: { name: string; color: string };
};

export function BlockerItem({ blocker }: { blocker: Blocker }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function resolve() {
    startTransition(async () => {
      await fetch("/api/blockers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: blocker.id, resolved: true }),
      });
      router.refresh();
    });
  }

  const date = formatMilestoneDate(blocker.createdAt.slice(0, 10));

  return (
    <article
      className={clsx(
        "border rounded-lg p-4 bg-surface",
        blocker.resolved ? "border-border/40 opacity-60" : "border-stuck/40"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-stuck">🚫</span>
          <span
            className="font-mono text-[10px] tracking-widest"
            style={{ color: blocker.project.color }}
          >
            {blocker.project.name}
          </span>
        </div>
        <span
          className={clsx(
            "text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full border",
            blocker.resolved
              ? "border-done/40 text-done bg-done/10"
              : "border-stuck/40 text-stuck bg-stuck/10"
          )}
        >
          {blocker.resolved ? "RESOLVED" : "OPEN"}
        </span>
      </div>

      <p className="text-sm text-text mb-3">{blocker.description}</p>
      <p className="text-[11px] font-mono text-accent-dim leading-relaxed mb-4">
        <span className="text-muted">WHY: </span>
        {blocker.reason}
      </p>

      <div className="flex items-center justify-between">
        {!blocker.resolved ? (
          <button
            onClick={resolve}
            disabled={pending}
            className="text-[10px] font-mono tracking-widest px-3 py-1.5 border border-accent-dim rounded hover:bg-accent hover:text-bg hover:border-accent transition-all"
          >
            RESOLVED ✓
          </button>
        ) : (
          <span />
        )}
        <span className="text-[10px] font-mono text-muted">{date}</span>
      </div>
    </article>
  );
}
