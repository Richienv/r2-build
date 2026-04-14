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

  const renderItem = (item: { href: string; label: string }) => {
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className="flex-1 flex items-center justify-center btn-press relative"
        style={{ height: "100%" }}
      >
        {active && (
          <span
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 28,
              height: 2,
              background: "#E8FF47",
            }}
          />
        )}
        <span
          className="font-mono text-[9px] uppercase"
          style={{
            color: active ? "#E8FF47" : "#555555",
            letterSpacing: "3px",
          }}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="h-16 shrink-0 flex items-center"
      style={{
        background: "#111111",
        borderTop: "1px solid #2a2a2a",
        overflow: "visible",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {leftItems.map(renderItem)}

      {/* Center OS button */}
      <div className="flex-1 flex items-center justify-center" style={{ overflow: "visible" }}>
        <button
          onClick={() => {
            window.location.href = "https://r2-os.vercel.app";
          }}
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

      {rightItems.map(renderItem)}
    </nav>
  );
}
