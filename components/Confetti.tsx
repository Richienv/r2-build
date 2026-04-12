"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#E8FF47", "#47FFB8", "#4A9BE8"];

export function Confetti({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      w: 4 + Math.random() * 6,
      h: 8 + Math.random() * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 10,
    }));

    let frame = 0;
    const maxFrames = 120;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const opacity = Math.max(0, 1 - frame / maxFrames);

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        onDone();
      }
    }

    requestAnimationFrame(animate);
  }, [onDone]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }} />
  );
}
