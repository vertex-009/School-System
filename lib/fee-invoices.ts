import type { SupabaseClient } from "@supabase/supabase-js";

/** Create / refresh unpaid invoices for a month (fee > 0 only). Never throws. Caps wait so pages cannot hang. */
export async function ensureCurrentMonthInvoices(
  supabase: SupabaseClient,
  opts?: { dueDay?: number; month?: number; year?: number; timeoutMs?: number }
) {
  const now = new Date();
  const month = opts?.month ?? now.getMonth() + 1;
  const year = opts?.year ?? now.getFullYear();
  const dueDay = opts?.dueDay ?? 10;
  const timeoutMs = opts?.timeoutMs ?? 8000;

  try {
    const rpcPromise = Promise.resolve(
      supabase.rpc("generate_invoices", {
        p_month: month,
        p_year: year,
        p_due_day: dueDay,
      })
    );

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      timer = setTimeout(() => resolve({ data: null, error: { message: "generate_invoices timed out" } }), timeoutMs);
    });

    const result = await Promise.race([rpcPromise, timedOut]);
    if (timer) clearTimeout(timer);
    return result;
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
