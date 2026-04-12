"use client";

import { useCallback, useState } from "react";
import { Confetti } from "./Confetti";

export function Celebration({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true);

  const confettiDone = useCallback(() => setShowConfetti(false), []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#080808", zIndex: 90 }}
      onClick={onDismiss}
    >
      {showConfetti && <Confetti onDone={confettiDone} />}
      <div className="celebration-in text-center">
        <p className="font-impact text-[120px] leading-none" style={{ color: "#E8FF47" }}>
          3/3
        </p>
        <p className="font-impact text-[64px] leading-none mt-2 text-white">SHIPPED.</p>
        <p className="font-mono text-base mt-6" style={{ color: "#47FFB8" }}>
          Day {streak} streak.
        </p>
      </div>
    </div>
  );
}
