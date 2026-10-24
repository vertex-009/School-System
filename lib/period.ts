import { MONTHS } from "@/lib/format";

export type Period = {
  month: number;
  year: number;
  label: string;
  /** true when period is after the current calendar month */
  isFuture: boolean;
  /** true when period is the current calendar month */
  isCurrent: boolean;
  /** true when period is before the current calendar month */
  isPast: boolean;
};

/** Parse month/year from search params (or form). Invalid values fall back to current month. */
export function parsePeriod(sp?: { month?: string | number | null; year?: string | number | null }): Period {
  const now = new Date();
  let month = Number(sp?.month ?? now.getMonth() + 1);
  let year = Number(sp?.year ?? now.getFullYear());
  if (!Number.isFinite(month) || month < 1 || month > 12) month = now.getMonth() + 1;
  if (!Number.isFinite(year) || year < 2000 || year > 2100) year = now.getFullYear();

  const curKey = now.getFullYear() * 12 + (now.getMonth() + 1);
  const key = year * 12 + month;

  return {
    month,
    year,
    label: `${MONTHS[month - 1]} ${year}`,
    isFuture: key > curKey,
    isCurrent: key === curKey,
    isPast: key < curKey,
  };
}

export function periodBounds(month: number, year: number) {
  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 1).toISOString();
  const dayStart = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const dayEnd = new Date(year, month, 1).toISOString().slice(0, 10);
  return { monthStart, monthEnd, dayStart, dayEnd };
}

export function toMonthKey(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const s = String(isoDate).trim();
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (year >= 1900 && month >= 1 && month <= 12) {
      return year * 12 + month;
    }
  }
  const d = new Date(s.length === 10 ? `${s}T12:00:00` : s);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear() * 12 + (d.getMonth() + 1);
}

/** @deprecated prefer inEmploymentWindow with joined_on */
export function activeFromMonth(createdAt: string | null | undefined, period: Period): boolean {
  return inEmploymentWindow(createdAt, null, period);
}

/**
 * Salary / history visible only from join month through leave/suspend month (inclusive).
 * Future calendar months → false.
 */
export function inEmploymentWindow(
  joinedOn: string | null | undefined,
  leftOn: string | null | undefined,
  period: Period | { month: number; year: number; isFuture?: boolean }
): boolean {
  if (period.isFuture) return false;
  if (!joinedOn) return false;
  const joinKey = toMonthKey(joinedOn);
  if (joinKey == null) return false;
  const periodKey = period.year * 12 + period.month;
  if (periodKey < joinKey) return false;
  if (leftOn) {
    const leftKey = toMonthKey(leftOn);
    if (leftKey != null && periodKey > leftKey) return false;
  }
  return true;
}

/**
 * Student fee visible only from admission/joining month onwards.
 * If period month is prior to student join month, returns false.
 */
export function inEnrollmentWindow(
  joinedOn: string | null | undefined,
  period: { month: number; year: number }
): boolean {
  if (!joinedOn) return true;
  const joinKey = toMonthKey(joinedOn);
  if (joinKey == null) return true;
  const periodKey = period.year * 12 + period.month;
  return periodKey >= joinKey;
}

/** Parse required join date from form (YYYY-MM-DD). */
export function requireJoinedOn(raw: FormDataEntryValue | null): { ok: true; joined_on: string } | { ok: false; error: string } {
  const s = String(raw || "").trim();
  if (!s) return { ok: false, error: "Join / entry date is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { ok: false, error: "Invalid join date" };
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid join date" };
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d.getTime() > today.getTime()) return { ok: false, error: "Join date cannot be in the future" };
  return { ok: true, joined_on: s };
}
