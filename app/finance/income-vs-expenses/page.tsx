import { Shell } from "@/components/shell";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function IncomeVsExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { monthStart, monthEnd, dayStart, dayEnd } = periodBounds(period.month, period.year);

  const [{ data: feePays }, { data: salaryPays }, { data: expenseRows }] = await Promise.all([
    supabase.from("payments").select("amount").eq("school_id", schoolId).gte("paid_at", monthStart).lt("paid_at", monthEnd),
    supabase
      .from("salary_payments")
      .select("amount")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
    supabase
      .from("school_expenses")
      .select("amount, kind")
      .eq("school_id", schoolId)
      .gte("expense_date", dayStart)
      .lt("expense_date", dayEnd),
  ]);

  const income = (feePays || []).reduce((s, p) => s + Number(p.amount), 0);
  const salaryOut = (salaryPays || []).reduce((s, p) => s + Number(p.amount), 0);
  const expenses = (expenseRows || []).filter((e) => e.kind === "school").reduce((s, e) => s + Number(e.amount), 0);
  const other = (expenseRows || []).filter((e) => e.kind === "other").reduce((s, e) => s + Number(e.amount), 0);
  const totalOut = salaryOut + expenses + other;
  const net = income - totalOut;
  const empty = income === 0 && totalOut === 0;

  return (
    <Shell role="finance" title="Income vs expenses">
      <PeriodFilter period={period} title="Period" submitLabel="Apply" />

      {empty ? (
        <Card title={period.label}>
          <NoHistory period={period} what="income or expense activity" />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Income", pkr(income), "bg-emerald-50"],
              ["Salaries", pkr(salaryOut), "bg-amber-50"],
              ["Expenses", pkr(expenses + other), "bg-rose-50"],
              ["Net", pkr(net), net >= 0 ? "bg-blue-50" : "bg-rose-50"],
            ].map(([l, v, bg]) => (
              <div key={String(l)} className={`rounded-3xl p-5 shadow-sm ${bg}`}>
                <p className="text-[11px] font-bold uppercase text-slate-500">{l}</p>
                <p className="mt-2 text-2xl font-bold">{v}</p>
              </div>
            ))}
          </div>

          <Card title={period.label}>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b py-2">
                <span>Fees</span>
                <b className="text-emerald-700">+ {pkr(income)}</b>
              </li>
              <li className="flex justify-between border-b py-2">
                <span>Salaries</span>
                <b className="text-rose-700">− {pkr(salaryOut)}</b>
              </li>
              <li className="flex justify-between border-b py-2">
                <span>School</span>
                <b className="text-rose-700">− {pkr(expenses)}</b>
              </li>
              <li className="flex justify-between border-b py-2">
                <span>Other</span>
                <b className="text-rose-700">− {pkr(other)}</b>
              </li>
              <li className="flex justify-between py-2">
                <span className="font-bold">Net</span>
                <b>{pkr(net)}</b>
              </li>
            </ul>
          </Card>
        </>
      )}
    </Shell>
  );
}
