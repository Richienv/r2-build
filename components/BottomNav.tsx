"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "HOME", icon: "◉" },
  { href: "/tasks", label: "TASKS", icon: "≡" },
  { href: "/milestones", label: "MILESTONES", icon: "▲" },
  { href: "/blockers", label: "BLOCKERS", icon: "✕" },
];

export function BottomNav({ hasOpenBlockers = false }: { hasOpenBlockers?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="h-16 border-t shrink-0 flex items-center justify-around"
      style={{ background: "#080808", borderColor: "#2A2A2A" }}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 relative btn-press">
            <span className="relative">
              <span className={`text-lg leading-none ${active ? "text-white" : "text-[#444]"}`}>
                {item.icon}
              </span>
              {item.href === "/blockers" && hasOpenBlockers && (
                <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-stuck" />
              )}
            </span>
            {active && (
              <span className="font-mono text-[9px] tracking-[3px] text-white">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
