"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/", label: "HOME", icon: "■" },
  { href: "/tasks", label: "TASKS", icon: "≡" },
  { href: "/milestones", label: "MILESTONES", icon: "▲" },
  { href: "/blockers", label: "BLOCKERS", icon: "✕" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="h-16 border-t border-border bg-surface flex items-center justify-around shrink-0">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors",
              active ? "text-accent" : "text-muted hover:text-accent-dim"
            )}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="text-[10px] font-mono tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
