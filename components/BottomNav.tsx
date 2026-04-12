"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const leftItems = [
  { href: "/", label: "HOME" },
  { href: "/tasks", label: "TASKS" },
];

const rightItems = [
  { href: "/milestones", label: "MILES" },
  { href: "/blockers", label: "BLOCKERS" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="h-16 shrink-0 flex items-center"
      style={{
        background: "#080808",
        borderTop: "0.5px solid rgba(255,255,255,0.1)",
        overflow: "visible",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>

      {/* Left 2 */}
      {leftItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}
            className="flex-1 flex items-center justify-center btn-press"
            style={{ height: "100%" }}>
            <span className="font-mono text-[9px] tracking-[3px]"
              style={{ color: active ? "#F0F0F0" : "#444" }}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Center OS button */}
      <div className="flex-1 flex items-center justify-center" style={{ overflow: "visible" }}>
        <button
          onClick={() => { window.location.href = "https://r2-os.vercel.app"; }}
          className="btn-press"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "#F0F0F0",
            color: "#080808",
            border: "none",
            cursor: "pointer",
            fontFamily: "Impact, 'Arial Narrow', sans-serif",
            fontSize: 16,
            letterSpacing: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateY(-12px)",
            boxShadow: "0 -4px 16px rgba(255,255,255,0.08)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          OS
        </button>
      </div>

      {/* Right 2 */}
      {rightItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}
            className="flex-1 flex items-center justify-center btn-press"
            style={{ height: "100%" }}>
            <span className="font-mono text-[9px] tracking-[3px]"
              style={{ color: active ? "#F0F0F0" : "#444" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
