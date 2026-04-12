"use client";

import { useEffect } from "react";

export function Celebration({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#080808", zIndex: 90 }}
      onClick={onDismiss}>
      <p className="font-impact text-[100px] leading-none" style={{ color: "#F0F0F0" }}>3/3</p>
      <p className="font-impact text-[56px] leading-none mt-2" style={{ color: "#F0F0F0" }}>SHIPPED.</p>
      <p className="font-mono text-sm mt-6" style={{ color: "#444444" }}>Day {streak} streak.</p>
    </div>
  );
}
