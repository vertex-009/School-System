import Link from "next/link";
import Image from "next/image";
import { Shell } from "@/components/shell";
import { NoHistory } from "@/components/period-filter";
import { ReportPrintButton } from "@/components/report-print-button";
import { GenerateInvoicesCard } from "@/components/generate-invoices-card";
import { SCHOOL } from "@/lib/brand";
import { classNameOf } from "@/lib/class-label";
import { MONTHS } from "@/lib/format";
import { inEmploymentWindow, parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  FinancialSummaryView,
  FeeInvoiceItem,
  SalaryItem,
  ExpenseItem,
} from "./financial-summary-view";

type Tab = "monthly" | "fees" | "salary" | "expenses";

export default async function FinancialSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const tab = (["monthly", "fees", "salary", "expenses"].includes(sp.tab || "") ? sp.tab : "monthly") as Tab;
  const period = parsePeriod(sp);
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const { monthStart, monthEnd, dayStart, dayEnd } = periodBounds(period.month, period.year);

  const [
    { data: school },
    { data: invoices },
    { data: payments },
    { data: expenseRows },
    { data: staff },
    { data: salaries },
    { data: salaryPays },
    { data: otherEmp },
    { data: otherPays },
  ] = await Promise.all([
    supabase.from("schools").select("name, address, phone").eq("id", schoolId).maybeSingle(),
    supabase
      .from("fee_invoices")
      .select("id, amount, discount, paid_amount, status, students(id, name, roll_no, admission_no, sections(name, classes(name)))")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
    supabase
      .from("payments")
      .select("id, invoice_id, amount, receipt_no, paid_at")
      .eq("school_id", schoolId)
      .gte("paid_at", monthStart)
      .lt("paid_at", monthEnd),
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

  const schoolName = "City Public School";

  // Auto-ensure invoices if none exist for this past/current month
  let rawInvoices = invoices;
  if (!period.isFuture && (!rawInvoices || rawInvoices.length === 0)) {
    const { ensureCurrentMonthInvoices } = await import("@/lib/fee-invoices");
    await ensureCurrentMonthInvoices(supabase, { month: period.month, year: period.year, dueDay: 10 });
    const { data: refetched } = await supabase
      .from("fee_invoices")
      .select("id, amount, discount, paid_amount, status, students(id, name, roll_no, admission_no, sections(name, classes(name)))")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year);
    if (refetched && refetched.length > 0) {
      rawInvoices = refetched;
    }
  }

  // Fees calculations
  const invoiceBilled = (rawInvoices || []).reduce((s, i) => s + Number(i.amount) - Number(i.discount || 0), 0);
  const collected = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const billed = Math.max(invoiceBilled, collected);
  const uncollected = Math.max(billed - collected, 0);

  const paymentByInvoice = new Map<string, { id: string; receipt_no: string; paid_at: string }>();
  for (const p of payments || []) {
    if (p.invoice_id) {
      paymentByInvoice.set(p.invoice_id, {
        id: p.id,
        receipt_no: p.receipt_no,
        paid_at: p.paid_at,
      });
    }
  }

  // Expenses calculations
  const allExpenses = expenseRows || [];
  const expensesTotal = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const schoolExpenses = allExpenses
    .filter((e) => e.kind === "school")
    .reduce((s, e) => s + Number(e.amount), 0);
  const otherExpenses = allExpenses
    .filter((e) => e.kind !== "school")
    .reduce((s, e) => s + Number(e.amount), 0);

  // Salaries calculations
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
    label: e.job_title || "Other Employee",
    booked: Number(e.monthly_salary) || 0,
    paidAmt: otherPaidMap[e.id] != null ? otherPaidMap[e.id]! : null,
  }));
  const salaryRows = [...portalRows, ...otherRows];
  const salaryPaidSum = salaryRows.filter((s) => s.paidAmt != null).reduce((s, t) => s + (t.paidAmt || 0), 0);
  const salaryDueSum = salaryRows.reduce((s, t) => s + t.booked, 0);

  const facultySalaries = (salaryPays || []).reduce((s, p) => s + Number(p.amount), 0);
  const otherStaffSalaries = (otherPays || []).reduce((s, p) => s + Number(p.amount), 0);

  const tabs: { id: Tab; label: string }[] = [
    { id: "monthly", label: "Monthly account" },
    { id: "fees", label: "Fee overview" },
    { id: "salary", label: "Salaries" },
    { id: "expenses", label: "Other Expenses" },
  ];

  const tabTitle =
    tab === "monthly"
      ? "Monthly Account"
      : tab === "fees"
        ? "Fee Overview"
        : tab === "salary"
          ? "Salaries Report"
          : "Other Expenses Report";

  const qs = (t: Tab) => `/principal/fees/overview?tab=${t}&month=${period.month}&year=${period.year}`;

  const feesEmpty = !(rawInvoices || []).length && collected === 0;
  const expensesEmpty = !allExpenses.length;
  const salaryEmpty = period.isFuture || (!salaryRows.length && (period.isPast || period.isCurrent));

  const mappedFeeInvoices: FeeInvoiceItem[] = (rawInvoices || []).map((inv) => {
    const student = inv.students as {
      id?: string;
      name?: string;
      roll_no?: number | null;
      admission_no?: string;
      sections?: unknown;
    } | null;
    const fee = Number(inv.amount) - Number(inv.discount || 0);
    const paid = Number(inv.paid_amount || 0);
    const payment = paymentByInvoice.get(inv.id);
    return {
      id: inv.id,
      amount: fee,
      discount: Number(inv.discount || 0),
      paid_amount: paid,
      status: inv.status || "unpaid",
      studentName: student?.name || "—",
      rollNo: student?.roll_no ?? null,
      admissionNo: student?.admission_no || "—",
      className: classNameOf(student?.sections),
      paymentId: payment ? payment.id : null,
    };
  });

  const mappedSalaryRows: SalaryItem[] = salaryRows.map((s) => ({
    id: s.id,
    name: s.name,
    label: s.label,
    booked: s.booked,
    paidAmt: s.paidAmt,
  }));

  const mappedExpenses: ExpenseItem[] = (allExpenses || []).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category || (e.kind === "school" ? "Operational" : "Other"),
    amount: Number(e.amount),
    expense_date: e.expense_date,
    kind: e.kind || "other",
  }));

  return (
    <Shell role="principal" title="Financial summary">
      <div className="space-y-5 print:space-y-4">
        {/* Official Print Header (Visible only when printed) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-slate-300">
              <Image src={SCHOOL.logoSrc} alt="" fill sizes="72px" className="object-cover object-center" />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950 font-serif">
                City Public School
              </h1>
              {SCHOOL.motto && (
                <p className="text-[11px] font-semibold italic text-slate-600 tracking-wide mt-0.5">
                  &ldquo;{SCHOOL.motto}&rdquo;
                </p>
              )}
              <p className="mt-1 text-xs font-semibold text-slate-700">
                Abbottabad, KPK, Pakistan
              </p>
              <div className="mt-2 inline-block rounded-md border border-slate-800 bg-slate-100 px-3 py-0.5 text-[11px] font-black uppercase tracking-widest text-slate-900">
                Official Financial Summary Report · {tabTitle}
              </div>
            </div>
            <div className="w-32 shrink-0 text-right text-[11px] text-slate-700 font-mono space-y-1">
              <div><span className="text-slate-500">Period:</span> <b>{period.label}</b></div>
              <div><span className="text-slate-500">Date:</span> {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
            </div>
          </div>
        </div>

        {/* Top Control Bar: Compact Period Filter & Print Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          {/* Compact Period Selector */}
          <div className="w-fit rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
            <form method="get" className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="tab" value={tab} />
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-[#0b1f3a]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span className="text-xs font-bold text-[#0b1f3a]">Period:</span>
              </div>

              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span>Month</span>
                <select
                  name="month"
                  defaultValue={String(period.month)}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-brand-navy focus:bg-white focus:outline-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span>Year</span>
                <input
                  name="year"
                  type="number"
                  min={2000}
                  max={2100}
                  defaultValue={period.year}
                  className="w-20 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-brand-navy focus:bg-white focus:outline-none"
                />
              </label>

              <button
                type="submit"
                className="rounded-xl bg-[#0b1f3a] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-accent active:scale-95"
              >
                Apply
              </button>
            </form>
          </div>

          <div className="self-end sm:self-center">
            <ReportPrintButton label={`Print ${tabTitle}`} />
          </div>
        </div>

        {/* Modern Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto [scrollbar-width:none] print:hidden">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={qs(t.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
                tab === t.id
                  ? "bg-[#0b1f3a] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Dynamic Tab Views via FinancialSummaryView (With By-Default Closed Lists) */}
        {tab === "monthly" && (
          <FinancialSummaryView
            tab="monthly"
            period={{ month: period.month, year: period.year, label: period.label }}
            feeBilled={billed}
            feeCollected={collected}
            feeUncollected={uncollected}
            feeInvoices={mappedFeeInvoices}
            salaryDueSum={salaryDueSum}
            salaryPaidSum={salaryPaidSum}
            salaryRows={mappedSalaryRows}
            expensesTotal={expensesTotal}
            schoolExpenses={schoolExpenses}
            otherExpenses={otherExpenses}
            allExpenses={mappedExpenses}
            facultySalaries={facultySalaries}
            otherStaffSalaries={otherStaffSalaries}
          />
        )}

        {tab === "fees" && (
          <div className="space-y-4">
            {!(rawInvoices || []).length && !period.isFuture && (
              <GenerateInvoicesCard role="principal" initialMonth={period.month} initialYear={period.year} />
            )}
            {feesEmpty ? (
              <NoHistory period={period} what="fee invoices / collections" />
            ) : (
              <FinancialSummaryView
                tab="fees"
                period={{ month: period.month, year: period.year, label: period.label }}
                feeBilled={billed}
                feeCollected={collected}
                feeUncollected={uncollected}
                feeInvoices={mappedFeeInvoices}
                salaryDueSum={salaryDueSum}
                salaryPaidSum={salaryPaidSum}
                salaryRows={mappedSalaryRows}
                expensesTotal={expensesTotal}
                schoolExpenses={schoolExpenses}
                otherExpenses={otherExpenses}
                allExpenses={mappedExpenses}
                facultySalaries={facultySalaries}
                otherStaffSalaries={otherStaffSalaries}
              />
            )}
          </div>
        )}

        {tab === "salary" &&
          (salaryEmpty ? (
            <NoHistory period={period} what="salary payments" />
          ) : (
            <FinancialSummaryView
              tab="salary"
              period={{ month: period.month, year: period.year, label: period.label }}
              feeBilled={billed}
              feeCollected={collected}
              feeUncollected={uncollected}
              feeInvoices={mappedFeeInvoices}
              salaryDueSum={salaryDueSum}
              salaryPaidSum={salaryPaidSum}
              salaryRows={mappedSalaryRows}
              expensesTotal={expensesTotal}
              schoolExpenses={schoolExpenses}
              otherExpenses={otherExpenses}
              allExpenses={mappedExpenses}
              facultySalaries={facultySalaries}
              otherStaffSalaries={otherStaffSalaries}
            />
          ))}

        {tab === "expenses" &&
          (expensesEmpty ? (
            <NoHistory period={period} what="expenses" />
          ) : (
            <FinancialSummaryView
              tab="expenses"
              period={{ month: period.month, year: period.year, label: period.label }}
              feeBilled={billed}
              feeCollected={collected}
              feeUncollected={uncollected}
              feeInvoices={mappedFeeInvoices}
              salaryDueSum={salaryDueSum}
              salaryPaidSum={salaryPaidSum}
              salaryRows={mappedSalaryRows}
              expensesTotal={expensesTotal}
              schoolExpenses={schoolExpenses}
              otherExpenses={otherExpenses}
              allExpenses={mappedExpenses}
              facultySalaries={facultySalaries}
              otherStaffSalaries={otherStaffSalaries}
            />
          ))}

        {/* Official Print Footer */}
        <div className="hidden print:block pt-8 text-center text-xs text-slate-600 border-t border-slate-300 mt-8">
          <p className="font-bold text-slate-900">Issued &amp; Authorized by: Principal Dashboard</p>
          <p className="text-[11px] text-slate-500 mt-0.5">City Public School Abbottabad KPK Pakistan · Executive Financial Statement</p>
        </div>
      </div>
    </Shell>
  );
}
