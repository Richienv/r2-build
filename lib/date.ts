export function todayCST(): string {
  const now = new Date();
  const cst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  const y = cst.getFullYear();
  const m = String(cst.getMonth() + 1).padStart(2, "0");
  const d = String(cst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatHeaderDate(date = new Date()): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
}

export function formatMilestoneDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}
