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

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "SHIP SOMETHING TODAY.";
  if (hour < 17) return "STILL BUILDING?";
  if (hour < 21) return "FINISH STRONG.";
  return "WHAT DID YOU BUILD?";
}

export function monthYear(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}
