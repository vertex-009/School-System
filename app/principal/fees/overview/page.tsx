import Link from "next/link";
import { Shell } from "@/components/shell";
import { BarChartCard, ColumnChartCard, RingCard, StatTiles } from "@/components/dashboard-charts";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

type Tab = "fees" | "salary" | "expenses";

export default async function FinancialSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const tab = (["fees", "salary", "expenses"].includes(sp.tab || "") ? sp.tab : "fees") as Tab;
  const period = parsePeriod(sp);
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const { monthStart, monthEnd, dayStart, dayEnd } = periodBounds(period.month, period.year);

  const [
    { data: invoices },
    { data: payments },
    { count: paidCount },
    { count: unpaidCount },
    { data: expenseRows },
    { data: staff },
    { data: salaries },
    { data: salaryPays },
    { data: otherEmp },
    { data: otherPays },
  ] = await Promise.all([
    supabase
      .from("fee_invoices")
      .select("amount, discount, paid_amount")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
    supabase.from("payments").select("amount").eq("school_id", schoolId).gte("paid_at", monthStart).lt("paid_at", monthEnd),
    supabase
      .from("fee_invoices")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year)
      .eq("status", "paid"),
    supabase
      .from("fee_invoices")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year)
      .in("status", ["unpaid", "partial"]),
    supabase
      .from("school_expenses")
      .select("id, title, category, amount, expense_date, kind")
      .eq("school_id", schoolId)
      .gte("expense_date", dayStart)
      .lt("expense_date", dayEnd)
      .order("expense_date", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, name, role, is_active, joined_on, left_on")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "finance"])
      .order("name"),
    supabase.from("teacher_salaries").select("teacher_id, monthly_salary").eq("school_id", schoolId),
    supabase
      .from("salary_payments")
      .select("teacher_id, amount")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
    supabase
      .from("other_employees")
      .select("id, name, job_title, monthly_salary, is_active, joined_on, left_on")
      .eq("school_id", schoolId)
      .order("name"),
    supabase
      .from("other_salary_payments")
      .select("employee_id, amount")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
  ]);

  const billed = (invoices || []).reduce((s, i) => s + Number(i.amount) - Number(i.discount || 0), 0);
  const collected = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const expensesTotal = (expenseRows || []).reduce((s, e) => s + Number(e.amount), 0);
  const collectionPct = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  const salaryMap = Object.fromEntries((salaries || []).map((s) => [s.teacher_id, Number(s.monthly_salary)]));
  const paidSalaryMap = Object.fromEntries((salaryPays || []).map((p) => [p.teacher_id, Number(p.amount)]));
  const otherPaidMap = Object.fromEntries((otherPays || []).map((p) => [p.employee_id, Number(p.amount)]));

  type SalaryRow = { id: string; name: string; label: string; booked: number; paidAmt: number | null };
  const portalIn = (staff || []).filter((s) => inEmploymentWindow(s.joined_on, s.left_on, period));
  const otherIn = (otherEmp || []).filter((e) => inEmploymentWindow(e.joined_on, e.left_on, period));
  const portalRows: SalaryRow[] = (
    period.isPast ? portalIn.filter((s) => paidSalaryMap[s.id] != null) : period.isCurrent ? portalIn : []
  ).map((s) => ({
    id: s.id,
    name: s.name,
    label: s.role === "finance" ? "Finance" : "Teacher",
    booked: salaryMap[s.id] || 0,
    paidAmt: paidSalaryMap[s.id] != null ? paidSalaryMap[s.id]! : null,
  }));
  const otherRows: SalaryRow[] = (
    period.isPast ? otherIn.filter((e) => otherPaidMap[e.id] != null) : period.isCurrent ? otherIn : []
  ).map((e) => ({
    id: e.id,
    name: e.name,
    label: e.job_title || "Other",
    booked: Number(e.monthly_salary) || 0,
    paidAmt: otherPaidMap[e.id] != null ? otherPaidMap[e.id]! : null,
  }));
  const salaryRows = [...portalRows, ...otherRows];
  const salaryPaid = salaryRows.filter((s) => s.paidAmt != null);
  const salaryUnpaid = salaryRows.filter((s) => s.paidAmt == null);
  const salaryPaidSum = salaryPaid.reduce((s, t) => s + (t.paidAmt || 0), 0);
  const salaryDueSum = salaryRows.reduce((s, t) => s + t.booked, 0);
  const salaryEmpty = period.isFuture || (!salaryRows.length && (period.isPast || period.isCurrent));

  const byCategory = new Map<string, number>();
  for (const e of expenseRows || []) {
    const key = e.category || e.kind || "Other";
    byCategory.set(key, (byCategory.get(key) || 0) + Number(e.amount));
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "fees", label: "Fee overview" },
    { id: "salary", label: "Salaries" },
    { id: "expenses", label: "Expenses" },
  ];

  const qs = (t: Tab) => `/principal/fees/overview?tab=${t}&month=${period.month}&year=${period.year}`;

  const feesEmpty = !(invoices || []).length && collected === 0;
  const expensesEmpty = !(expenseRows || []).length;

  return (
    <Shell role="principal" title="Financial summary">
      <p className="text-sm text-slate-600">View only · data from Finance (fees, salaries, expenses).</p>

      <PeriodFilter period={period} title="Period" hidden={{ tab }} submitLabel="Apply" />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={qs(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === t.id ? "bg-brand-navy text-white" : "border border-slate-200 bg-white text-brand-navy hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "fees" &&
        (feesEmpty ? (
          <NoHistory period={period} what="fee invoices / collections" />
        ) : (
          <>
            <StatTiles
              items={[
                { label: "Paid invoices", value: paidCount || 0, tone: "emerald" },
                { label: "Unpaid / partial", value: unpaidCount || 0, tone: "amber" },
                { label: "Billed", value: pkr(billed), tone: "navy" },
                { label: "Collected", value: pkr(collected), tone: "sky" },
              ]}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <RingCard
                title="Collection rate"
                percent={collectionPct}
                center={`${collectionPct}%`}
                footnote={`${period.label} billed vs collected`}
                color="#0b1f3a"
              />
              <BarChartCard
                title="Fees this month"
                subtitle={period.label}
                items={[
                  { label: "Paid", value: paidCount || 0, color: "#059669" },
                  { label: "Unpaid", value: unpaidCount || 0, color: "#d97706" },
                  { label: "Billed (PKR)", value: Math.round(billed), color: "#0b1f3a" },
                  { label: "Collected (PKR)", value: Math.round(collected), color: "#5dade2" },
                ]}
              />
            </div>
          </>
        ))}

      {tab === "salary" &&
        (salaryEmpty ? (
          <NoHistory period={period} what="salary payments" />
        ) : (
          <>
            <StatTiles
              items={[
                { label: "Paid staff", value: salaryPaid.length, tone: "emerald" },
                { label: "Unpaid staff", value: salaryUnpaid.length, tone: "amber" },
                { label: "Paid out", value: pkr(salaryPaidSum), tone: "navy" },
                { label: "Salary book", value: pkr(salaryDueSum), tone: "sky", hint: "Active staff monthly total" },
              ]}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <ColumnChartCard
                title="Salary status"
                subtitle={period.label}
                items={[
                  { label: "Paid", value: salaryPaid.length, color: "#059669" },
                  { label: "Unpaid", value: salaryUnpaid.length, color: "#d97706" },
                ]}
              />
              <BarChartCard
                title="Amounts"
                items={[
                  { label: "Paid out (PKR)", value: Math.round(salaryPaidSum), color: "#059669" },
                  { label: "Booked (PKR)", value: Math.round(salaryDueSum), color: "#0b1f3a" },
                ]}
              />
            </div>
            <Card title="Staff salaries" subtitle="Teachers, finance & other employees · view only">
              <ul className="divide-y text-sm">
                {salaryRows.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <b>{s.name}</b>
                      <span className="ml-2 text-xs text-slate-500">{s.label}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums text-slate-600">{pkr(s.booked)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          s.paidAmt != null ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {s.paidAmt != null ? `Paid · ${pkr(s.paidAmt)}` : "Unpaid"}
                      </span>
                    </span>
                  </li>
                ))}
                {!salaryRows.length && <p className="text-sm text-slate-500">No active staff.</p>}
              </ul>
            </Card>
          </>
        ))}

      {tab === "expenses" &&
        (expensesEmpty ? (
          <NoHistory period={period} what="expenses" />
        ) : (
          <>
            <StatTiles
              items={[
                { label: "Expenses", value: pkr(expensesTotal), tone: "rose" },
                { label: "Entries", value: (expenseRows || []).length, tone: "navy" },
                { label: "Fee collected", value: pkr(collected), tone: "emerald", hint: "Same month" },
                {
                  label: "Net (fees − exp)",
                  value: pkr(collected - expensesTotal),
                  tone: collected - expensesTotal >= 0 ? "sky" : "amber",
                },
              ]}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <ColumnChartCard
                title="By category"
                subtitle={period.label}
                items={[...byCategory.entries()].map(([label, value], i) => ({
                  label,
                  value: Math.round(value),
                  color: ["#e11d48", "#0b1f3a", "#d97706", "#1a5276", "#5dade2"][i % 5],
                }))}
              />
              <BarChartCard
                title="Cash flow snapshot"
                items={[
                  { label: "Collected", value: Math.round(collected), color: "#059669" },
                  { label: "Expenses", value: Math.round(expensesTotal), color: "#e11d48" },
                  { label: "Salaries paid", value: Math.round(salaryPaidSum), color: "#d97706" },
                ]}
              />
            </div>
            <Card title="Expense list" subtitle="From Finance · view only">
              <ul className="divide-y text-sm">
                {(expenseRows || []).map((e) => (
                  <li key={e.id} className="flex justify-between gap-2 py-2.5">
                    <span>
                      <b>{e.title}</b>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {e.category || e.kind || "—"} · {e.expense_date}
                      </span>
                    </span>
                    <b className="text-rose-700">{pkr(Number(e.amount))}</b>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        ))}
    </Shell>
  );
}
