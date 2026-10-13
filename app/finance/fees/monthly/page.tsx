import { Shell } from "@/components/shell";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const period = parsePeriod(sp);
  const { monthStart, monthEnd } = periodBounds(period.month, period.year);

  const [{ data: invoices }, { data: payments }] = await Promise.all([
    supabase
      .from("fee_invoices")
      .select("amount, discount, paid_amount, status")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
    supabase
      .from("payments")
      .select("amount")
      .eq("school_id", schoolId)
      .gte("paid_at", monthStart)
      .lt("paid_at", monthEnd),
  ]);

  const list = invoices || [];
  const billed = list.reduce((s, i) => s + Number(i.amount) - Number(i.discount || 0), 0);
  const collectedInv = list.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const collectedCash = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const paid = list.filter((i) => i.status === "paid").length;
  const unpaid = list.filter((i) => i.status !== "paid").length;
  const empty = list.length === 0 && collectedCash === 0;

  return (
    <Shell role="finance" title="Monthly report">
      <PeriodFilter period={period} title="Period" submitLabel="Apply" />

      {empty ? (
        <Card title={period.label}>
          <NoHistory period={period} what="fee collection" />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Paid", String(paid)],
            ["Unpaid", String(unpaid)],
            ["Billed", pkr(billed)],
            ["Collected", pkr(collectedInv)],
            ["Cash", pkr(collectedCash)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">{l}</p>
              <p className="text-2xl font-bold">{v}</p>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
