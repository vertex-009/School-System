import { deleteSchoolExpense } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { AddSchoolExpenseForm } from "./add-form";

export default async function SchoolExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { dayStart, dayEnd } = periodBounds(period.month, period.year);
  const today = new Date().toISOString().slice(0, 10);

  const { data: rows, error } = await supabase
    .from("school_expenses")
    .select("id, title, category, amount, expense_date, note")
    .eq("school_id", schoolId)
    .eq("kind", "school")
    .gte("expense_date", dayStart)
    .lt("expense_date", dayEnd)
    .order("expense_date", { ascending: false });

  const list = error ? [] : rows || [];
  const monthTotal = list.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <Shell role="finance" title="School expenses">
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Run <code className="font-mono text-xs">migration_expenses_and_paid_unpaid.sql</code> in Supabase.
        </div>
      )}

      <PeriodFilter period={period} title="Period" submitLabel="Show" />

      <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">{period.label} expenses</p>
        <p className="mt-1 text-2xl font-bold text-rose-900">{pkr(monthTotal)}</p>
      </div>

      {!period.isFuture && (
        <AddSchoolExpenseForm defaultDate={period.isCurrent ? today : dayStart} />
      )}

      <Card title={`List · ${period.label}`}>
        {!list.length && !error ? (
          <NoHistory period={period} what="school expenses" />
        ) : (
          <ul className="divide-y text-sm">
            {list.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <b>{r.title}</b>
                  <p className="text-xs text-slate-500">
                    {r.category || "—"} · {r.expense_date}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <b>{pkr(r.amount)}</b>
                  <form action={deleteSchoolExpense.bind(null, r.id)}>
                    <button type="submit" className="text-xs font-bold text-rose-600">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
