/** HH:MM + period index → display start time (optional break after period N). */
export function periodStartTime(
  dayStart: string,
  period: number,
  periodMinutes: number,
  breakAfterPeriod: number,
  breakMinutes: number
): string {
  const [h0, m0] = dayStart.split(":").map(Number);
  let total = (period - 1) * periodMinutes;
  if (breakAfterPeriod > 0 && period > breakAfterPeriod) total += breakMinutes;
  let mins = h0 * 60 + m0 + total;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
