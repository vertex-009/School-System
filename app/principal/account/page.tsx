import { Shell } from "@/components/shell";
import { PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PrincipalMonthlyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const { monthStart, monthEnd, dayStart, dayEnd } = periodBounds(period.month, period.year);

  const [{ data: feePays }, { data: expenseRows }, { data: staffPays }, { data: otherPays }] = await Promise.all([
    period.isFuture
      ? Promise.resolve({ data: [] as { amount: number }[] })
      : supabase
          .from("payments")
          .select("amount")
          .eq("school_id", schoolId)
          .gte("paid_at", monthStart)
          .lt("paid_at", monthEnd),
    period.isFuture
      ? Promise.resolve({ data: [] as { amount: number }[] })
      : supabase
          .from("school_expenses")
          .select("amount")
          .eq("school_id", schoolId)
          .gte("expense_date", dayStart)
          .lt("expense_date", dayEnd),
    period.isFuture
      ? Promise.resolve({ data: [] as { amount: number }[] })
      : supabase
          .from("salary_payments")
          .select("amount")
          .eq("school_id", schoolId)
          .eq("month", period.month)
          .eq("year", period.year),
    period.isFuture
      ? Promise.resolve({ data: [] as { amount: number }[] })
      : supabase
          .from("other_salary_payments")
          .select("amount")
          .eq("school_id", schoolId)
          .eq("month", period.month)
          .eq("year", period.year),
  ]);

  const feeCollection = (feePays || []).reduce((s, p) => s + Number(p.amount), 0);
  const expenses = (expenseRows || []).reduce((s, e) => s + Number(e.amount), 0);
  const staffSalaries = (staffPays || []).reduce((s, p) => s + Number(p.amount), 0);
  const otherSalaries = (otherPays || []).reduce((s, p) => s + Number(p.amount), 0);
  const totalOut = expenses + staffSalaries + otherSalaries;
  const net = feeCollection - totalOut;

  return (
    <Shell role="principal" title="Monthly account">
      <PeriodFilter period={period} title="Month" submitLabel="Show" />

      <Card title="Account summary" subtitle={`${period.label} · calculation only`}>
        {period.isFuture ? (
          <p className="text-sm text-slate-500">No record found for a future month.</p>
        ) : (
          <>
            <dl className="mx-auto max-w-lg space-y-3 text-sm">
              <Row label="Fee collection" value={pkr(feeCollection)} tone="in" />
              <Row label="Expenses" value={pkr(expenses)} tone="out" />
              <Row label="Salaries — teachers & finance" value={pkr(staffSalaries)} tone="out" />
              <Row label="Salaries — other employees" value={pkr(otherSalaries)} tone="out" />
              <div className="border-t border-slate-200 pt-3">
                <Row label="Total outflows" value={pkr(totalOut)} tone="muted" />
              </div>
              <div
                className={`mt-2 flex items-center justify-between rounded-2xl px-4 py-4 ${
                  net >= 0 ? "bg-emerald-50" : "bg-rose-50"
                }`}
              >
                <span className="text-sm font-bold text-brand-navy">Net balance</span>
                <span
                  className={`text-2xl font-black tabular-nums ${
                    net >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {pkr(net)}
                </span>
              </div>
            </dl>
            <p className="mt-4 text-center text-xs text-slate-400">
              Net = Fee collection − Expenses − Staff salaries − Other employee salaries
            </p>
          </>
        )}
      </Card>
    </Shell>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "in" | "out" | "muted";
}) {
  const valueClass =
    tone === "in"
      ? "font-bold text-emerald-700"
      : tone === "out"
        ? "font-semibold text-rose-700"
        : "font-bold text-slate-700";
  const prefix = tone === "in" ? "+ " : tone === "out" ? "− " : "";
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-600">{label}</dt>
      <dd className={`tabular-nums ${valueClass}`}>
        {prefix}
        {value}
      </dd>
    </div>
  );
}
