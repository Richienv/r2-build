type Status = "BUILDING" | "STUCK" | "WAITING" | "PAUSED" | "DONE";

export function StatusPill({ status, color }: { status: Status; color?: string }) {
  const c =
    status === "STUCK" ? "#FF4747" :
    status === "WAITING" ? "#888888" :
    status === "DONE" ? "#47FFB8" :
    color ?? "#F0F0F0";

  return (
    <span
      className="px-2.5 py-1 font-mono text-[10px] tracking-[3px] rounded-full"
      style={{
        background: `${c}15`,
        border: `1px solid ${c}40`,
        color: c,
      }}
    >
      {status}
    </span>
  );
}
