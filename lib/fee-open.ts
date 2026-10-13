import type { SupabaseClient } from "@supabase/supabase-js";
import { MONTHS } from "@/lib/format";
import { parsePeriod, type Period } from "@/lib/period";

export type FeeOpenInput = {
  fee_month?: string | number | null;
  fee_year?: string | number | null;
  body?: string | null;
  title?: string | null;
  audiences?: string[];
  due_day?: string | number | null;
};

export type FeeOpenOk = {
  ok: true;
  period: Period;
  title: string;
  body: string;
  audiences: string[];
  dueDay: number;
};

export type FeeOpenErr = { ok: false; error: string };

/** Calendar + form checks (no DB). Future months always rejected. */
export function validateFeeOpenForm(input: FeeOpenInput): FeeOpenOk | FeeOpenErr {
  const period = parsePeriod({ month: input.fee_month, year: input.fee_year });
  if (period.isFuture) {
    return {
      ok: false,
      error: `Cannot open fee collection for a future month (${period.label}). Use current or previous month.`,
    };
  }
  if (period.year < 2000 || period.year > 2100) {
    return { ok: false, error: "Invalid year" };
  }
  if (period.month < 1 || period.month > 12) {
    return { ok: false, error: "Invalid month" };
  }

  const body = String(input.body || "").trim();
  if (body.length < 8) {
    return { ok: false, error: "Write a short notice body (at least a few words) for staff / parents." };
  }

  let audiences = (input.audiences || []).map((a) => String(a).trim()).filter(Boolean);
  audiences = [...new Set(audiences)];
  if (!audiences.length) {
    return { ok: false, error: "Select at least one recipient (Principal and/or Teachers)." };
  }
  const allowed = new Set(["principal", "teachers"]);
  for (const a of audiences) {
    if (!allowed.has(a)) return { ok: false, error: "Invalid audience for fee announcement" };
  }

  let dueDay = Number(input.due_day ?? 10);
  if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 28) dueDay = 10;

  let title = String(input.title || "").trim();
  if (!title) title = `Fee collection open — ${period.label}`;

  return { ok: true, period, title, body, audiences, dueDay };
}

/** DB prerequisites: active students + class fees set. */
export async function validateFeeOpenPrereqs(
  supabase: SupabaseClient,
  schoolId: string,
  period: Period
): Promise<{ ok: true } | FeeOpenErr> {
  const [{ count: studentCount, error: sErr }, { data: fees, error: fErr }] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "active"),
    supabase.from("fee_structure").select("id, monthly_fee").eq("school_id", schoolId).gt("monthly_fee", 0).limit(1),
  ]);

  if (sErr) return { ok: false, error: sErr.message };
  if (fErr) return { ok: false, error: fErr.message };
  if (!studentCount) {
    return { ok: false, error: "No active students — add students before opening fee collection." };
  }
  if (!fees?.length) {
    return {
      ok: false,
      error: "Set class fees first (Set class fees) — at least one class needs monthly fee > 0.",
    };
  }

  // Soft check: period label available for messages
  void period;
  return { ok: true };
}

/** Whether Finance already opened this fee month (announcement kind = fee_open). */
export async function isFeeMonthOpened(
  supabase: SupabaseClient,
  schoolId: string,
  month: number,
  year: number
): Promise<{ opened: boolean; missingMigration?: boolean }> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id")
    .eq("school_id", schoolId)
    .eq("kind", "fee_open")
    .eq("fee_month", month)
    .eq("fee_year", year)
    .limit(1);

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("kind") || msg.includes("fee_month") || msg.includes("column")) {
      return { opened: false, missingMigration: true };
    }
    return { opened: false };
  }
  return { opened: Boolean(data?.length) };
}

export async function latestFeeOpen(
  supabase: SupabaseClient,
  schoolId: string
): Promise<{ month: number; year: number; label: string; created_at: string } | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select("fee_month, fee_year, created_at")
    .eq("school_id", schoolId)
    .eq("kind", "fee_open")
    .not("fee_month", "is", null)
    .order("fee_year", { ascending: false })
    .order("fee_month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.fee_month || !data?.fee_year) return null;
  return {
    month: data.fee_month,
    year: data.fee_year,
    label: `${MONTHS[data.fee_month - 1]} ${data.fee_year}`,
    created_at: data.created_at,
  };
}
