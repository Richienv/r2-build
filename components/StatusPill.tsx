import clsx from "clsx";

type Status = "BUILDING" | "STUCK" | "WAITING" | "PAUSED" | "DONE";

const styles: Record<Status, string> = {
  BUILDING: "bg-building/15 text-building border-building/40",
  STUCK: "bg-stuck/15 text-stuck border-stuck/40",
  WAITING: "bg-waiting/15 text-waiting border-waiting/40",
  PAUSED: "bg-muted/20 text-muted border-muted/40",
  DONE: "bg-done/15 text-done border-done/40",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={clsx(
        "px-2 py-0.5 text-[10px] font-mono tracking-widest border rounded-full uppercase",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}
