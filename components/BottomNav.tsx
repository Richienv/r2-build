"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "HOME" },
  { href: "/tasks", label: "TASKS" },
  { href: "/milestones", label: "MILESTONES" },
  { href: "/blockers", label: "BLOCKERS" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="h-14 shrink-0 flex items-center justify-around"
      style={{ background: "#080808", borderTop: "0.5px solid #2A2A2A" }}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}
            className="font-mono text-[9px] tracking-[3px] px-3 py-2 btn-press"
            style={{ color: active ? "#F0F0F0" : "#444444" }}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
