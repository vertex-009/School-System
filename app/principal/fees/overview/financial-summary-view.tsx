"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pkr } from "@/lib/format";

export interface FeeInvoiceItem {
  id: string;
  amount: number;
  discount: number;
  paid_amount: number;
  status: string;
  studentName: string;
  rollNo: number | string | null;
  admissionNo: string;
  className: string;
  paymentId?: string | null;
}

export interface SalaryItem {
  id: string;
  name: string;
  label: string;
  booked: number;
  paidAmt: number | null;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  kind: string;
}

function formatCompact(val: number) {
  if (val === 0) return "0";
  const abs = Math.abs(val);
  if (abs >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1000) return `${(val / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(val);
}

function getChartTicks(max: number) {
  if (max <= 0) return { ceiling: 10000, ticks: [10000, 7500, 5000, 2500, 0] };
  const digits = Math.floor(Math.log10(max));
  const base = Math.pow(10, digits);
  const normalized = max / base;
  let ceilingNormalized = 10;
  if (normalized <= 1) ceilingNormalized = 1;
  else if (normalized <= 1.5) ceilingNormalized = 1.5;
  else if (normalized <= 2) ceilingNormalized = 2;
  else if (normalized <= 2.5) ceilingNormalized = 2.5;
  else if (normalized <= 3) ceilingNormalized = 3;
  else if (normalized <= 4) ceilingNormalized = 4;
  else if (normalized <= 5) ceilingNormalized = 5;
  else if (normalized <= 6) ceilingNormalized = 6;
  else if (normalized <= 7.5) ceilingNormalized = 7.5;
  else if (normalized <= 8) ceilingNormalized = 8;
  else ceilingNormalized = 10;
  const ceiling = ceilingNormalized * base;
  const ticks = [ceiling, (ceiling * 4) / 5, (ceiling * 3) / 5, (ceiling * 2) / 5, ceiling / 5, 0];
  return { ceiling, ticks };
}

export function FinancialSummaryView({
  tab,
  period,
  // Fee data
  feeBilled,
  feeCollected,
  feeUncollected,
  feeInvoices,
  // Staff Salary data (Faculty / Teachers & Finance)
  staffSalaryDueSum,
  staffSalaryPaidSum,
  staffSalaryRows,
  // Other Employees Salary data
  otherSalaryDueSum,
  otherSalaryPaidSum,
  otherSalaryRows,
  // Fallback / legacy salary data
  salaryDueSum = 0,
  salaryPaidSum = 0,
  salaryRows = [],
  // Expense data
  expensesTotal,
  schoolExpenses,
  otherExpenses,
  allExpenses,
  // Monthly Account data
  facultySalaries = 0,
  otherStaffSalaries = 0,
}: {
  tab: "monthly" | "fees" | "salary" | "other-salary" | "expenses";
  period: { month: number; year: number; label: string };
  feeBilled: number;
  feeCollected: number;
  feeUncollected: number;
  feeInvoices: FeeInvoiceItem[];
  staffSalaryDueSum?: number;
  staffSalaryPaidSum?: number;
  staffSalaryRows?: SalaryItem[];
  otherSalaryDueSum?: number;
  otherSalaryPaidSum?: number;
  otherSalaryRows?: SalaryItem[];
  salaryDueSum?: number;
  salaryPaidSum?: number;
  salaryRows?: SalaryItem[];
  expensesTotal: number;
  schoolExpenses: number;
  otherExpenses: number;
  allExpenses: ExpenseItem[];
  facultySalaries?: number;
  otherStaffSalaries?: number;
}) {
  const pathname = usePathname();
  const isFinance = pathname?.startsWith("/finance");

  // State for Fees Tab: null (closed by default), "all", "paid", or "unpaid"
  const [feeFilter, setFeeFilter] = useState<"all" | "paid" | "unpaid" | null>(null);
  const [feeSearch, setFeeSearch] = useState("");

  // State for Staff Salary Tab: null (closed by default), "all", "paid", or "unpaid"
  const [staffSalaryFilter, setStaffSalaryFilter] = useState<"all" | "paid" | "unpaid" | null>(null);
  const [staffSalarySearch, setStaffSalarySearch] = useState("");

  // State for Other Employees Salary Tab: null (closed by default), "all", "paid", or "unpaid"
  const [otherSalaryFilter, setOtherSalaryFilter] = useState<"all" | "paid" | "unpaid" | null>(null);
  const [otherSalarySearch, setOtherSalarySearch] = useState("");

  // State for Expenses Tab: null (closed by default), "all", "school", or "other"
  const [expenseFilter, setExpenseFilter] = useState<"all" | "school" | "other" | null>(null);
  const [expenseSearch, setExpenseSearch] = useState("");

  // Reset all filters when tab or period changes so by default NOTHING is open
  useEffect(() => {
    setFeeFilter(null);
    setFeeSearch("");
    setStaffSalaryFilter(null);
    setStaffSalarySearch("");
    setOtherSalaryFilter(null);
    setOtherSalarySearch("");
    setExpenseFilter(null);
    setExpenseSearch("");
  }, [tab, period.month, period.year]);

  // Derived Fee lists
  const paidFeeInvoices = feeInvoices.filter((i) => i.status === "paid");
  const unpaidFeeInvoices = feeInvoices.filter((i) => i.status !== "paid");

  const displayedFeeInvoices = feeInvoices.filter((i) => {
    if (feeFilter === "paid" && i.status !== "paid") return false;
    if (feeFilter === "unpaid" && i.status === "paid") return false;
    if (feeSearch.trim()) {
      const q = feeSearch.toLowerCase().trim();
      const matchName = i.studentName.toLowerCase().includes(q);
      const matchRoll = String(i.rollNo || "").includes(q);
      const matchAdm = i.admissionNo.toLowerCase().includes(q);
      const matchClass = i.className.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchAdm && !matchClass) return false;
    }
    return true;
  });

  // Effective Staff Salary data (Teachers & Finance)
  const effectiveStaffRows = staffSalaryRows || salaryRows || [];
  const effectiveStaffDue = staffSalaryDueSum ?? salaryDueSum ?? 0;
  const effectiveStaffPaid = staffSalaryPaidSum ?? salaryPaidSum ?? 0;

  const paidStaffSalaryRows = effectiveStaffRows.filter((s) => s.paidAmt != null);
  const unpaidStaffSalaryRows = effectiveStaffRows.filter((s) => s.paidAmt == null);

  const displayedStaffSalaryRows = effectiveStaffRows.filter((s) => {
    if (staffSalaryFilter === "paid" && s.paidAmt == null) return false;
    if (staffSalaryFilter === "unpaid" && s.paidAmt != null) return false;
    if (staffSalarySearch.trim()) {
      const q = staffSalarySearch.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchRole = s.label.toLowerCase().includes(q);
      if (!matchName && !matchRole) return false;
    }
    return true;
  });

  // Effective Other Employee Salary data (Non-teaching staff)
  const effectiveOtherRows = otherSalaryRows || [];
  const effectiveOtherDue = otherSalaryDueSum ?? 0;
  const effectiveOtherPaid = otherSalaryPaidSum ?? 0;

  const paidOtherSalaryRows = effectiveOtherRows.filter((s) => s.paidAmt != null);
  const unpaidOtherSalaryRows = effectiveOtherRows.filter((s) => s.paidAmt == null);

  const displayedOtherSalaryRows = effectiveOtherRows.filter((s) => {
    if (otherSalaryFilter === "paid" && s.paidAmt == null) return false;
    if (otherSalaryFilter === "unpaid" && s.paidAmt != null) return false;
    if (otherSalarySearch.trim()) {
      const q = otherSalarySearch.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchRole = s.label.toLowerCase().includes(q);
      if (!matchName && !matchRole) return false;
    }
    return true;
  });

  // Derived Expense lists
  const schoolExpenseRows = allExpenses.filter((e) => e.kind === "school");
  const otherExpenseRows = allExpenses.filter((e) => e.kind !== "school");

  const displayedExpenseRows = allExpenses.filter((e) => {
    if (expenseFilter === "school" && e.kind !== "school") return false;
    if (expenseFilter === "other" && e.kind === "school") return false;
    if (expenseSearch.trim()) {
      const q = expenseSearch.toLowerCase().trim();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchCategory = e.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory) return false;
    }
    return true;
  });

  // Monthly Account calculations
  const totalOutflows = expensesTotal + facultySalaries + otherStaffSalaries;
  const netBalance = feeCollected - totalOutflows;

  const chartBars = [
    {
      label: "Fee Collection",
      shortLabel: "Fee Collection",
      value: feeCollected,
      color: "#059669",
      bgDot: "bg-emerald-500",
      gradient: "linear-gradient(to top, #059669, #10b981)",
      type: "inflow",
    },
    {
      label: "Other Expenses",
      shortLabel: "Expenses",
      value: expensesTotal,
      color: "#e11d48",
      bgDot: "bg-rose-500",
      gradient: "linear-gradient(to top, #be123c, #fb7185)",
      type: "outflow",
      share: totalOutflows > 0 ? ((expensesTotal / totalOutflows) * 100).toFixed(0) : "0",
    },
    {
      label: "Faculty Salaries",
      shortLabel: "Faculty",
      value: facultySalaries,
      color: "#d97706",
      bgDot: "bg-amber-500",
      gradient: "linear-gradient(to top, #d97706, #fbbf24)",
      type: "outflow",
      share: totalOutflows > 0 ? ((facultySalaries / totalOutflows) * 100).toFixed(0) : "0",
    },
    {
      label: "Other Staff Salaries",
      shortLabel: "Other Staff",
      value: otherStaffSalaries,
      color: "#ea580c",
      bgDot: "bg-orange-500",
      gradient: "linear-gradient(to top, #ea580c, #fb923c)",
      type: "outflow",
      share: totalOutflows > 0 ? ((otherStaffSalaries / totalOutflows) * 100).toFixed(0) : "0",
    },
    {
      label: "Total Outflows",
      shortLabel: "Total Out",
      value: totalOutflows,
      color: "#334155",
      bgDot: "bg-slate-700",
      gradient: "linear-gradient(to top, #334155, #64748b)",
      type: "total",
    },
  ];

  const maxVal = Math.max(...chartBars.map((b) => b.value), 0);
  const { ceiling, ticks } = getChartTicks(maxVal);

  return (
    <div>
      {/* ============================================================ */}
      {/* 0. MONTHLY ACCOUNT TAB (Shown before Fee Overview)           */}
      {/* ============================================================ */}
      {tab === "monthly" && (
        <div className="space-y-4">
          {/* 6 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Card 1: Fee Collection */}
            <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 shadow-sm border border-emerald-600/80 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                  Fee Collection
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                  + {pkr(feeCollected)}
                </p>
              </div>
            </div>

            {/* Card 2: Other Expenses */}
            <div className="flex flex-col justify-between rounded-2xl bg-[#ffe4e6] border border-[#fecdd3] text-[#9f1239] p-4 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9f1239]">
                  Other Expenses
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fecdd3]/80 text-[#be123c]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-black text-[#be123c] tabular-nums">
                  - {pkr(expensesTotal)}
                </p>
              </div>
            </div>

            {/* Card 3: Faculty Salaries */}
            <div className="flex flex-col justify-between rounded-2xl bg-[#fef3c7] border border-[#fde68a] text-[#92400e] p-4 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#92400e]">
                  Faculty Salaries
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fde68a]/80 text-[#b45309]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-black text-[#b45309] tabular-nums">
                  - {pkr(facultySalaries)}
                </p>
              </div>
            </div>

            {/* Card 4: Other Staff Salaries */}
            <div className="flex flex-col justify-between rounded-2xl bg-[#ffedd5] border border-[#fed7aa] text-[#9a3412] p-4 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9a3412]">
                  Other Staff Salaries
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fed7aa]/80 text-[#c2410c]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="9" cy="7" r="4" />
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-black text-[#c2410c] tabular-nums">
                  - {pkr(otherStaffSalaries)}
                </p>
              </div>
            </div>

            {/* Card 5: Total Outflows */}
            <div className="flex flex-col justify-between rounded-2xl bg-[#0b1f3a] text-white p-4 shadow-sm border border-slate-800 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Total Outflows
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                  - {pkr(totalOutflows)}
                </p>
              </div>
            </div>

            {/* Card 6: Net Balance */}
            <div
              className={`flex flex-col justify-between rounded-2xl p-4 shadow-sm border transition hover:shadow-md ${
                netBalance >= 0
                  ? "bg-gradient-to-br from-[#10b981] to-[#047857] text-white border-emerald-600"
                  : "bg-gradient-to-br from-[#f43f5e] to-[#be123c] text-white border-rose-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                  Net Balance
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  {netBalance >= 0 ? "Surplus" : "Deficit"}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-black tabular-nums">
                  {netBalance >= 0 ? `+ ${pkr(netBalance)}` : `- ${pkr(Math.abs(netBalance))}`}
                </p>
              </div>
            </div>
          </div>

          {/* Visual Comparison Chart & Breakdown Table in an Executive Split Layout */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-[#0b1f3a]">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zM16.2 13h2.8v6h-2.8z" />
                    </svg>
                  </span>
                  <h2 className="text-base font-bold text-[#0b1f3a]">
                    Monthly Financial Comparison · {period.label}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Side-by-side volume distribution of inflows versus expenditure streams
                </p>
              </div>

              {/* Quick Legend Chips */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 print:hidden">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Inflows</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span>Outflows</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span>Total Volume</span>
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Visual Bar Chart (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-slate-50/70 p-4 sm:p-5 border border-slate-200/60">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#0b1f3a]">Transaction Streams Volume</p>
                    <span className="text-[11px] font-semibold text-slate-400">Values in PKR</span>
                  </div>
                </div>

                {/* Chart Frame */}
                <div className="mt-4 relative h-64 sm:h-72 w-full pt-6 pb-6">
                  {/* Y-Axis Grid Lines & Tick Labels */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
                    {ticks.map((t, idx) => (
                      <div key={idx} className="flex items-center w-full">
                        <span className="w-12 text-[10px] font-mono text-slate-400 shrink-0 text-right pr-2">
                          {formatCompact(t)}
                        </span>
                        <div className="flex-1 border-b border-slate-200/70 border-dashed" />
                      </div>
                    ))}
                  </div>

                  {/* Bars Container */}
                  <div className="absolute inset-0 pl-14 pr-2 flex items-end justify-around">
                    {chartBars.map((bar, i) => {
                      const heightPercent = ceiling > 0 ? (bar.value / ceiling) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="group relative flex flex-col items-center h-full justify-end"
                          style={{ width: `${100 / chartBars.length}%` }}
                        >
                          {/* Interactive Tooltip on hover */}
                          <div className="absolute -top-11 z-20 hidden group-hover:flex flex-col items-center pointer-events-none">
                            <div className="rounded-lg bg-[#0b1f3a] text-white px-2.5 py-1 text-[11px] font-bold shadow-lg whitespace-nowrap">
                              <span>{pkr(bar.value)}</span>
                              {bar.share && <span className="opacity-75 text-[10px] ml-1">({bar.share}%)</span>}
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#0b1f3a] rotate-45 -mt-1" />
                          </div>

                          {/* Top Value indicator */}
                          <span className="text-[10px] font-mono font-bold text-slate-500 mb-1.5 group-hover:text-[#0b1f3a]">
                            {formatCompact(bar.value)}
                          </span>

                          {/* Professional Bar with subtle background track */}
                          <div className="w-8 sm:w-10 h-full flex flex-col justify-end rounded-t-lg bg-slate-200/40 p-0.5">
                            <div
                              className="w-full rounded-t-md transition-all duration-500 shadow-xs group-hover:brightness-110"
                              style={{
                                height: `${Math.max(heightPercent, 4)}%`,
                                backgroundImage: bar.gradient,
                              }}
                            />
                          </div>

                          {/* Bottom Label below bar */}
                          <div className="absolute -bottom-5 w-full max-w-[85px] text-center truncate">
                            <p className="text-[10px] font-bold text-slate-600 truncate leading-tight group-hover:text-[#0b1f3a]">
                              {bar.shortLabel}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Executive Breakdown Summary Table (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Expenditure &amp; Revenue Summary
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {period.label}
                  </span>
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  {/* Revenue row */}
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-2 border border-emerald-100/70">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-bold text-emerald-950">Fee Collection</span>
                    </div>
                    <span className="font-black text-emerald-800 tabular-nums">
                      + {pkr(feeCollected)}
                    </span>
                  </div>

                  {/* Outflow Breakdown Items */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-700">Other Expenses</span>
                        {totalOutflows > 0 && (
                          <span className="text-[10px] font-medium text-slate-400">
                            ({((expensesTotal / totalOutflows) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {pkr(expensesTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-700">Faculty Salaries</span>
                        {totalOutflows > 0 && (
                          <span className="text-[10px] font-medium text-slate-400">
                            ({((facultySalaries / totalOutflows) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {pkr(facultySalaries)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                        <span className="font-semibold text-slate-700">Other Staff Salaries</span>
                        {totalOutflows > 0 && (
                          <span className="text-[10px] font-medium text-slate-400">
                            ({((otherStaffSalaries / totalOutflows) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {pkr(otherStaffSalaries)}
                      </span>
                    </div>
                  </div>

                  {/* Total Outflows Summary Row */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-100/70 p-2 border border-slate-200/80 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-700 shrink-0" />
                      <span>Total Outflows</span>
                    </div>
                    <span className="font-black text-slate-900 tabular-nums">
                      - {pkr(totalOutflows)}
                    </span>
                  </div>

                  {/* Net Difference Row */}
                  <div
                    className={`flex items-center justify-between rounded-xl p-2.5 font-bold border ${
                      netBalance >= 0
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          netBalance >= 0 ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      />
                      <span>Net Surplus / Deficit</span>
                    </div>
                    <span
                      className={`font-black text-sm tabular-nums ${
                        netBalance >= 0 ? "text-emerald-800" : "text-rose-800"
                      }`}
                    >
                      {netBalance >= 0 ? `+ ${pkr(netBalance)}` : `- ${pkr(Math.abs(netBalance))}`}
                    </span>
                  </div>
                </div>

                {/* Bottom Quick Indicator Note */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Account balance audit status</span>
                  <span className="font-semibold text-slate-600">Reconciled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. FEE OVERVIEW TAB (With View / Hide on each card)          */}
      {/* ============================================================ */}
      {tab === "fees" && (
        <div className="space-y-4">
          {/* 3 Stat Cards: Total Fee, Paid (with View/Hide), Unpaid (with View/Hide) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Fee (Clickable to view all invoices) */}
            <button
              type="button"
              onClick={() => setFeeFilter((prev) => (prev === "all" ? null : "all"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                feeFilter === "all"
                  ? "border-[#1a5276] bg-gradient-to-br from-[#0b1f3a] via-[#102d54] to-[#1a5276] text-white shadow-md ring-2 ring-sky-400"
                  : "border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] to-[#1a5276] text-white hover:border-sky-400/80 shadow-xs"
              }`}
              title={feeFilter === "all" ? "Click to close list" : "Click to view All invoices"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 print:text-slate-800">
                    Total Fee
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black text-white">
                    {feeInvoices.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      feeFilter === "all"
                        ? "bg-white text-[#0b1f3a] shadow-xs"
                        : "bg-white/15 text-white group-hover:bg-white/25"
                    }`}
                  >
                    <span>{feeFilter === "all" ? "Hide" : "View"}</span>
                    <span>{feeFilter === "all" ? "▴" : "▾"}</span>
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums print:text-black">
                  {pkr(feeBilled)}
                </span>
                <span className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {feeInvoices.length > 0 ? `${feeInvoices.length} Total` : (feeBilled > 0 ? "Recorded" : "0 Total")}
                </span>
              </div>
            </button>

            {/* Card 2: Paid (Clickable to view paid invoices) */}
            <button
              type="button"
              onClick={() => setFeeFilter((prev) => (prev === "paid" ? null : "paid"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                feeFilter === "paid"
                  ? "border-emerald-600 bg-emerald-100/90 ring-2 ring-emerald-500/40 shadow-sm"
                  : "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:border-emerald-400 shadow-xs"
              }`}
              title={feeFilter === "paid" ? "Click to close list" : "Click to view Paid fees"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 print:text-slate-900">
                    Paid Fees
                  </span>
                  <span className="rounded-full bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-black text-emerald-800">
                    {paidFeeInvoices.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      feeFilter === "paid"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200"
                    }`}
                  >
                    <span>{feeFilter === "paid" ? "Hide" : "View"}</span>
                    <span>{feeFilter === "paid" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      feeFilter === "paid" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums print:text-black">
                  {pkr(feeCollected)}
                </span>
                <span className="text-xs font-bold text-emerald-800 print:text-slate-700">
                  {paidFeeInvoices.length > 0 ? `${paidFeeInvoices.length} Paid` : (feeCollected > 0 ? "Collected" : "0 Paid")}
                </span>
              </div>
            </button>

            {/* Card 3: Unpaid (Clickable to view unpaid invoices) */}
            <button
              type="button"
              onClick={() => setFeeFilter((prev) => (prev === "unpaid" ? null : "unpaid"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                feeFilter === "unpaid"
                  ? "border-rose-600 bg-rose-100/90 ring-2 ring-rose-500/40 shadow-sm"
                  : "border-rose-200/90 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 hover:border-rose-400 shadow-xs"
              }`}
              title={feeFilter === "unpaid" ? "Click to close list" : "Click to view Unpaid fees"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 print:text-slate-900">
                    Unpaid Fees
                  </span>
                  <span className="rounded-full bg-rose-100 border border-rose-200/80 px-2 py-0.5 text-[11px] font-black text-rose-800">
                    {unpaidFeeInvoices.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      feeFilter === "unpaid"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-rose-100 text-rose-800 group-hover:bg-rose-200"
                    }`}
                  >
                    <span>{feeFilter === "unpaid" ? "Hide" : "View"}</span>
                    <span>{feeFilter === "unpaid" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      feeFilter === "unpaid" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-rose-700 tabular-nums print:text-black">
                  {pkr(feeUncollected)}
                </span>
                <span className="text-xs font-bold text-rose-800 print:text-slate-700">
                  {unpaidFeeInvoices.length} Unpaid
                </span>
              </div>
            </button>
          </div>

          {/* Print-only summary overview when no individual list is clicked */}
          {feeFilter === null && (
            <div className="hidden print:block rounded-xl border border-slate-800 p-4 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5">
                Financial Summary · Fee Overview ({period.label})
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Description</th>
                    <th className="p-2 text-center border-r border-slate-300">Count / Invoices</th>
                    <th className="p-2 text-right">Total Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200">Total Billed Fees</td>
                    <td className="p-2 text-center border-r border-slate-200">{feeInvoices.length}</td>
                    <td className="p-2 text-right font-bold">{pkr(feeBilled)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-emerald-800">Total Fees Collected (Paid)</td>
                    <td className="p-2 text-center border-r border-slate-200">{paidFeeInvoices.length}</td>
                    <td className="p-2 text-right font-bold text-emerald-800">{pkr(feeCollected)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-rose-800">Total Fees Outstanding (Unpaid)</td>
                    <td className="p-2 text-center border-r border-slate-200">{unpaidFeeInvoices.length}</td>
                    <td className="p-2 text-right font-bold text-rose-800">{pkr(feeUncollected)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Directory Table - ONLY displayed when user clicks a card */}
          {feeFilter !== null && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs animate-fadeIn">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    feeFilter === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : feeFilter === "unpaid"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {feeFilter === "paid" ? "Paid Invoices" : feeFilter === "unpaid" ? "Unpaid Invoices" : "All Invoices"} ({displayedFeeInvoices.length})
                </span>

                <div className="flex items-center gap-2.5 print:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search student, roll, class…"
                      value={feeSearch}
                      onChange={(e) => setFeeSearch(e.target.value)}
                      className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition"
                    />
                    {feeSearch && (
                      <button
                        type="button"
                        onClick={() => setFeeSearch("")}
                        className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFeeFilter(null)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    title="Close list"
                  >
                    <span>Close</span>
                    <span>✕</span>
                  </button>
                </div>
              </div>

              {displayedFeeInvoices.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  <p className="font-bold text-slate-600">No record found</p>
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 pl-5 pr-3">Student</th>
                        <th className="px-3 py-3">Admission</th>
                        <th className="px-3 py-3">Class</th>
                        <th className="px-3 py-3">Fee Due</th>
                        <th className="px-3 py-3">Paid Amount</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="py-3 pl-3 pr-5 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedFeeInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="font-bold text-slate-900">{inv.studentName}</div>
                            <div className="text-[10px] text-slate-400">Roll: {inv.rollNo ?? "—"}</div>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{inv.admissionNo}</td>
                          <td className="px-3 py-3.5">{inv.className}</td>
                          <td className="px-3 py-3.5 font-bold text-slate-800">{pkr(inv.amount)}</td>
                          <td className="px-3 py-3.5 font-bold text-emerald-700">{pkr(inv.paid_amount)}</td>
                          <td className="px-3 py-3.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                inv.status === "paid"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : inv.status === "partial"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {inv.status ? inv.status.toUpperCase() : "UNPAID"}
                            </span>
                          </td>
                          <td className="py-3.5 pl-3 pr-5 text-right">
                            {inv.paymentId ? (
                              <Link
                                href={isFinance ? `/finance/fees/receipts/${inv.paymentId}` : `/principal/fees/receipts/${inv.paymentId}`}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b1f3a] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-accent shadow-xs cursor-pointer active:scale-95"
                              >
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="6 9 6 2 18 2 18 9" />
                                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                  <rect x="6" y="14" width="12" height="8" />
                                </svg>
                                Print receipt
                              </Link>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. STAFF SALARIES TAB (With View / Hide on each card)        */}
      {/* ============================================================ */}
      {tab === "salary" && (
        <div className="space-y-4">
          {/* 3 Stat Cards: Total Staff Salary, Paid Staff Salaries, Unpaid Staff Salaries */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Staff Salary */}
            <button
              type="button"
              onClick={() => setStaffSalaryFilter((prev) => (prev === "all" ? null : "all"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                staffSalaryFilter === "all"
                  ? "border-[#1a5276] bg-gradient-to-br from-[#0b1f3a] via-[#102d54] to-[#1a5276] text-white shadow-md ring-2 ring-sky-400"
                  : "border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] to-[#1a5276] text-white hover:border-sky-400/80 shadow-xs"
              }`}
              title={staffSalaryFilter === "all" ? "Click to close list" : "Click to view All Staff Salaries"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 print:text-slate-800">
                    Total Staff Salary
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black text-white">
                    {effectiveStaffRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      staffSalaryFilter === "all"
                        ? "bg-white text-[#0b1f3a] shadow-xs"
                        : "bg-white/15 text-white group-hover:bg-white/25"
                    }`}
                  >
                    <span>{staffSalaryFilter === "all" ? "Hide" : "View"}</span>
                    <span>{staffSalaryFilter === "all" ? "▴" : "▾"}</span>
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums print:text-black">
                  {pkr(effectiveStaffDue)}
                </span>
                <span className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {effectiveStaffRows.length} Faculty Booked
                </span>
              </div>
            </button>

            {/* Card 2: Paid Staff Salaries */}
            <button
              type="button"
              onClick={() => setStaffSalaryFilter((prev) => (prev === "paid" ? null : "paid"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                staffSalaryFilter === "paid"
                  ? "border-emerald-600 bg-emerald-100/90 ring-2 ring-emerald-500/40 shadow-sm"
                  : "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:border-emerald-400 shadow-xs"
              }`}
              title={staffSalaryFilter === "paid" ? "Click to close list" : "Click to view Paid Staff Salaries"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 print:text-slate-900">
                    Paid Staff Salaries
                  </span>
                  <span className="rounded-full bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-black text-emerald-800">
                    {paidStaffSalaryRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      staffSalaryFilter === "paid"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200"
                    }`}
                  >
                    <span>{staffSalaryFilter === "paid" ? "Hide" : "View"}</span>
                    <span>{staffSalaryFilter === "paid" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      staffSalaryFilter === "paid" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums print:text-black">
                  {pkr(effectiveStaffPaid)}
                </span>
                <span className="text-xs font-bold text-emerald-800 print:text-slate-700">
                  {paidStaffSalaryRows.length} Paid
                </span>
              </div>
            </button>

            {/* Card 3: Unpaid Staff Salaries */}
            <button
              type="button"
              onClick={() => setStaffSalaryFilter((prev) => (prev === "unpaid" ? null : "unpaid"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                staffSalaryFilter === "unpaid"
                  ? "border-amber-600 bg-amber-100/90 ring-2 ring-amber-500/40 shadow-sm"
                  : "border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:border-amber-400 shadow-xs"
              }`}
              title={staffSalaryFilter === "unpaid" ? "Click to close list" : "Click to view Unpaid Staff Salaries"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 print:text-slate-900">
                    Unpaid Staff Salaries
                  </span>
                  <span className="rounded-full bg-amber-100 border border-amber-200/80 px-2 py-0.5 text-[11px] font-black text-amber-800">
                    {unpaidStaffSalaryRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      staffSalaryFilter === "unpaid"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-100 text-amber-800 group-hover:bg-amber-200"
                    }`}
                  >
                    <span>{staffSalaryFilter === "unpaid" ? "Hide" : "View"}</span>
                    <span>{staffSalaryFilter === "unpaid" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      staffSalaryFilter === "unpaid" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-amber-800 tabular-nums print:text-black">
                  {pkr(Math.max(effectiveStaffDue - effectiveStaffPaid, 0))}
                </span>
                <span className="text-xs font-bold text-amber-800 print:text-slate-700">
                  {unpaidStaffSalaryRows.length} Pending
                </span>
              </div>
            </button>
          </div>

          {/* Print-only summary overview */}
          {staffSalaryFilter === null && (
            <div className="hidden print:block rounded-xl border border-slate-800 p-4 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5">
                Financial Summary · Staff Salaries Overview ({period.label})
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Description</th>
                    <th className="p-2 text-center border-r border-slate-300">Staff Count</th>
                    <th className="p-2 text-right">Total Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200">Total Booked Staff Salaries</td>
                    <td className="p-2 text-center border-r border-slate-200">{effectiveStaffRows.length}</td>
                    <td className="p-2 text-right font-bold">{pkr(effectiveStaffDue)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-emerald-800">Total Staff Salaries Paid</td>
                    <td className="p-2 text-center border-r border-slate-200">{paidStaffSalaryRows.length}</td>
                    <td className="p-2 text-right font-bold text-emerald-800">{pkr(effectiveStaffPaid)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-amber-800">Total Staff Salaries Pending / Unpaid</td>
                    <td className="p-2 text-center border-r border-slate-200">{unpaidStaffSalaryRows.length}</td>
                    <td className="p-2 text-right font-bold text-amber-800">{pkr(Math.max(effectiveStaffDue - effectiveStaffPaid, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Directory Table - ONLY displayed when user clicks a card */}
          {staffSalaryFilter !== null && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs animate-fadeIn">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    staffSalaryFilter === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : staffSalaryFilter === "unpaid"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {staffSalaryFilter === "paid" ? "Paid Staff Salaries" : staffSalaryFilter === "unpaid" ? "Unpaid Staff Salaries" : "All Staff Salaries"} ({displayedStaffSalaryRows.length})
                </span>

                <div className="flex items-center gap-2.5 print:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search staff by name/role…"
                      value={staffSalarySearch}
                      onChange={(e) => setStaffSalarySearch(e.target.value)}
                      className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition"
                    />
                    {staffSalarySearch && (
                      <button
                        type="button"
                        onClick={() => setStaffSalarySearch("")}
                        className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStaffSalaryFilter(null)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    title="Close list"
                  >
                    <span>Close</span>
                    <span>✕</span>
                  </button>
                </div>
              </div>

              {displayedStaffSalaryRows.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  <p className="font-bold text-slate-600">No staff record found</p>
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 pl-5 pr-4">Staff Member</th>
                        <th className="py-3 pr-4">Role</th>
                        <th className="py-3 pr-4">Monthly Salary</th>
                        <th className="py-3 pr-5 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedStaffSalaryRows.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pl-5 pr-4 font-bold text-[#0b1f3a]">{s.name}</td>
                          <td className="py-3 pr-4 text-xs font-semibold text-slate-500">{s.label}</td>
                          <td className="py-3 pr-4 tabular-nums font-semibold text-slate-700">{pkr(s.booked)}</td>
                          <td className="py-3 pr-5 text-right">
                            {s.paidAmt != null ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-bold text-amber-600">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                Unpaid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. OTHER EMPLOYEE SALARIES TAB (With View / Hide on each card)*/}
      {/* ============================================================ */}
      {tab === "other-salary" && (
        <div className="space-y-4">
          {/* 3 Stat Cards: Total Other Salary, Paid Other Salary, Unpaid Other Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Other Employees Salary */}
            <button
              type="button"
              onClick={() => setOtherSalaryFilter((prev) => (prev === "all" ? null : "all"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                otherSalaryFilter === "all"
                  ? "border-[#1a5276] bg-gradient-to-br from-[#0b1f3a] via-[#102d54] to-[#1a5276] text-white shadow-md ring-2 ring-sky-400"
                  : "border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] to-[#1a5276] text-white hover:border-sky-400/80 shadow-xs"
              }`}
              title={otherSalaryFilter === "all" ? "Click to close list" : "Click to view All Other Employees Salaries"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 print:text-slate-800">
                    Total Other Employees Salary
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black text-white">
                    {effectiveOtherRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      otherSalaryFilter === "all"
                        ? "bg-white text-[#0b1f3a] shadow-xs"
                        : "bg-white/15 text-white group-hover:bg-white/25"
                    }`}
                  >
                    <span>{otherSalaryFilter === "all" ? "Hide" : "View"}</span>
                    <span>{otherSalaryFilter === "all" ? "▴" : "▾"}</span>
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums print:text-black">
                  {pkr(effectiveOtherDue)}
                </span>
                <span className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {effectiveOtherRows.length} Staff Booked
                </span>
              </div>
            </button>

            {/* Card 2: Paid Other Salaries */}
            <button
              type="button"
              onClick={() => setOtherSalaryFilter((prev) => (prev === "paid" ? null : "paid"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                otherSalaryFilter === "paid"
                  ? "border-emerald-600 bg-emerald-100/90 ring-2 ring-emerald-500/40 shadow-sm"
                  : "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:border-emerald-400 shadow-xs"
              }`}
              title={otherSalaryFilter === "paid" ? "Click to close list" : "Click to view Paid Other Salaries"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 print:text-slate-900">
                    Paid Salaries
                  </span>
                  <span className="rounded-full bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-black text-emerald-800">
                    {paidOtherSalaryRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      otherSalaryFilter === "paid"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200"
                    }`}
                  >
                    <span>{otherSalaryFilter === "paid" ? "Hide" : "View"}</span>
                    <span>{otherSalaryFilter === "paid" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      otherSalaryFilter === "paid" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums print:text-black">
                  {pkr(effectiveOtherPaid)}
                </span>
                <span className="text-xs font-bold text-emerald-800 print:text-slate-700">
                  {paidOtherSalaryRows.length} Paid
                </span>
              </div>
            </button>

            {/* Card 3: Unpaid Other Salaries */}
            <button
              type="button"
              onClick={() => setOtherSalaryFilter((prev) => (prev === "unpaid" ? null : "unpaid"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                otherSalaryFilter === "unpaid"
                  ? "border-amber-600 bg-amber-100/90 ring-2 ring-amber-500/40 shadow-sm"
                  : "border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:border-amber-400 shadow-xs"
              }`}
              title={otherSalaryFilter === "unpaid" ? "Click to close list" : "Click to view Unpaid Other Salaries"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 print:text-slate-900">
                    Unpaid Salaries
                  </span>
                  <span className="rounded-full bg-amber-100 border border-amber-200/80 px-2 py-0.5 text-[11px] font-black text-amber-800">
                    {unpaidOtherSalaryRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      otherSalaryFilter === "unpaid"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-100 text-amber-800 group-hover:bg-amber-200"
                    }`}
                  >
                    <span>{otherSalaryFilter === "unpaid" ? "Hide" : "View"}</span>
                    <span>{otherSalaryFilter === "unpaid" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      otherSalaryFilter === "unpaid" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-amber-800 tabular-nums print:text-black">
                  {pkr(Math.max(effectiveOtherDue - effectiveOtherPaid, 0))}
                </span>
                <span className="text-xs font-bold text-amber-800 print:text-slate-700">
                  {unpaidOtherSalaryRows.length} Pending
                </span>
              </div>
            </button>
          </div>

          {/* Print-only summary overview */}
          {otherSalaryFilter === null && (
            <div className="hidden print:block rounded-xl border border-slate-800 p-4 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5">
                Financial Summary · Other Employee Salaries Overview ({period.label})
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Description</th>
                    <th className="p-2 text-center border-r border-slate-300">Staff Count</th>
                    <th className="p-2 text-right">Total Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200">Total Booked Other Salaries</td>
                    <td className="p-2 text-center border-r border-slate-200">{effectiveOtherRows.length}</td>
                    <td className="p-2 text-right font-bold">{pkr(effectiveOtherDue)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-emerald-800">Total Other Salaries Paid</td>
                    <td className="p-2 text-center border-r border-slate-200">{paidOtherSalaryRows.length}</td>
                    <td className="p-2 text-right font-bold text-emerald-800">{pkr(effectiveOtherPaid)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-amber-800">Total Other Salaries Pending / Unpaid</td>
                    <td className="p-2 text-center border-r border-slate-200">{unpaidOtherSalaryRows.length}</td>
                    <td className="p-2 text-right font-bold text-amber-800">{pkr(Math.max(effectiveOtherDue - effectiveOtherPaid, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Directory Table - ONLY displayed when user clicks a card */}
          {otherSalaryFilter !== null && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs animate-fadeIn">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    otherSalaryFilter === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : otherSalaryFilter === "unpaid"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {otherSalaryFilter === "paid" ? "Paid Other Salaries" : otherSalaryFilter === "unpaid" ? "Unpaid Other Salaries" : "All Other Salaries"} ({displayedOtherSalaryRows.length})
                </span>

                <div className="flex items-center gap-2.5 print:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search employee by name/job…"
                      value={otherSalarySearch}
                      onChange={(e) => setOtherSalarySearch(e.target.value)}
                      className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition"
                    />
                    {otherSalarySearch && (
                      <button
                        type="button"
                        onClick={() => setOtherSalarySearch("")}
                        className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOtherSalaryFilter(null)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    title="Close list"
                  >
                    <span>Close</span>
                    <span>✕</span>
                  </button>
                </div>
              </div>

              {displayedOtherSalaryRows.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  <p className="font-bold text-slate-600">No employee record found</p>
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 pl-5 pr-4">Employee Name</th>
                        <th className="py-3 pr-4">Job Title / Designation</th>
                        <th className="py-3 pr-4">Monthly Salary</th>
                        <th className="py-3 pr-5 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedOtherSalaryRows.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pl-5 pr-4 font-bold text-[#0b1f3a]">{s.name}</td>
                          <td className="py-3 pr-4 text-xs font-semibold text-slate-500">{s.label}</td>
                          <td className="py-3 pr-4 tabular-nums font-semibold text-slate-700">{pkr(s.booked)}</td>
                          <td className="py-3 pr-5 text-right">
                            {s.paidAmt != null ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-bold text-amber-600">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                Unpaid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. OTHER EXPENSES TAB (With View / Hide on each card)        */}
      {/* ============================================================ */}
      {tab === "expenses" && (
        <div className="space-y-4">
          {/* 3 Stat Cards: Total Expenses, School Expenses, Other Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Expenses (Clickable to view all expenses) */}
            <button
              type="button"
              onClick={() => setExpenseFilter((prev) => (prev === "all" ? null : "all"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                expenseFilter === "all"
                  ? "border-[#1a5276] bg-gradient-to-br from-[#0b1f3a] via-[#102d54] to-[#1a5276] text-white shadow-md ring-2 ring-sky-400"
                  : "border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] to-[#1a5276] text-white hover:border-sky-400/80 shadow-xs"
              }`}
              title={expenseFilter === "all" ? "Click to close list" : "Click to view All Expenses"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 print:text-slate-800">
                    Total Expenses
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black text-white">
                    {allExpenses.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      expenseFilter === "all"
                        ? "bg-white text-[#0b1f3a] shadow-xs"
                        : "bg-white/15 text-white group-hover:bg-white/25"
                    }`}
                  >
                    <span>{expenseFilter === "all" ? "Hide" : "View"}</span>
                    <span>{expenseFilter === "all" ? "▴" : "▾"}</span>
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums print:text-black">
                  - {pkr(expensesTotal)}
                </span>
                <span className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {allExpenses.length} Entries
                </span>
              </div>
            </button>

            {/* Card 2: School Expenses (Clickable to view school expenses) */}
            <button
              type="button"
              onClick={() => setExpenseFilter((prev) => (prev === "school" ? null : "school"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                expenseFilter === "school"
                  ? "border-rose-600 bg-rose-100/90 ring-2 ring-rose-500/40 shadow-sm"
                  : "border-rose-200/90 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 hover:border-rose-400 shadow-xs"
              }`}
              title={expenseFilter === "school" ? "Click to close list" : "Click to view School Expenses"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 print:text-slate-900">
                    School Expenses
                  </span>
                  <span className="rounded-full bg-rose-100 border border-rose-200/80 px-2 py-0.5 text-[11px] font-black text-rose-800">
                    {schoolExpenseRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      expenseFilter === "school"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-rose-100 text-rose-800 group-hover:bg-rose-200"
                    }`}
                  >
                    <span>{expenseFilter === "school" ? "Hide" : "View"}</span>
                    <span>{expenseFilter === "school" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      expenseFilter === "school" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-rose-700 tabular-nums print:text-black">
                  - {pkr(schoolExpenses)}
                </span>
                <span className="text-xs font-bold text-rose-800 print:text-slate-700">
                  {schoolExpenseRows.length} Entries
                </span>
              </div>
            </button>

            {/* Card 3: Other Expenses (Clickable to view other expenses) */}
            <button
              type="button"
              onClick={() => setExpenseFilter((prev) => (prev === "other" ? null : "other"))}
              className={`group relative rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none select-none ${
                expenseFilter === "other"
                  ? "border-amber-600 bg-amber-100/90 ring-2 ring-amber-500/40 shadow-sm"
                  : "border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:border-amber-400 shadow-xs"
              }`}
              title={expenseFilter === "other" ? "Click to close list" : "Click to view Other Expenses"}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 print:text-slate-900">
                    Other Expenses
                  </span>
                  <span className="rounded-full bg-amber-100 border border-amber-200/80 px-2 py-0.5 text-[11px] font-black text-amber-800">
                    {otherExpenseRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      expenseFilter === "other"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-100 text-amber-800 group-hover:bg-amber-200"
                    }`}
                  >
                    <span>{expenseFilter === "other" ? "Hide" : "View"}</span>
                    <span>{expenseFilter === "other" ? "▴" : "▾"}</span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      expenseFilter === "other" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-amber-800 tabular-nums print:text-black">
                  - {pkr(otherExpenses)}
                </span>
                <span className="text-xs font-bold text-amber-800 print:text-slate-700">
                  {otherExpenseRows.length} Entries
                </span>
              </div>
            </button>
          </div>

          {/* Print-only summary overview when no individual list is clicked */}
          {expenseFilter === null && (
            <div className="hidden print:block rounded-xl border border-slate-800 p-4 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5">
                Financial Summary · Expenditures Overview ({period.label})
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Description</th>
                    <th className="p-2 text-center border-r border-slate-300">Entries</th>
                    <th className="p-2 text-right">Total Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-rose-800">Operational / School Expenses</td>
                    <td className="p-2 text-center border-r border-slate-200">{schoolExpenseRows.length}</td>
                    <td className="p-2 text-right font-bold text-rose-800">- {pkr(schoolExpenses)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-amber-800">Other Miscellaneous Expenses</td>
                    <td className="p-2 text-center border-r border-slate-200">{otherExpenseRows.length}</td>
                    <td className="p-2 text-right font-bold text-amber-800">- {pkr(otherExpenses)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200">Total Outflow Expenses</td>
                    <td className="p-2 text-center border-r border-slate-200">{allExpenses.length}</td>
                    <td className="p-2 text-right font-bold">- {pkr(expensesTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Directory Table - ONLY displayed when user clicks a card */}
          {expenseFilter !== null && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs animate-fadeIn">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    expenseFilter === "school"
                      ? "bg-rose-100 text-rose-800"
                      : expenseFilter === "other"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {expenseFilter === "school" ? "School Expenses" : expenseFilter === "other" ? "Other Expenses" : "All Expenses"} ({displayedExpenseRows.length})
                </span>

                <div className="flex items-center gap-2.5 print:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search title, category…"
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition"
                    />
                    {expenseSearch && (
                      <button
                        type="button"
                        onClick={() => setExpenseSearch("")}
                        className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpenseFilter(null)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    title="Close list"
                  >
                    <span>Close</span>
                    <span>✕</span>
                  </button>
                </div>
              </div>

              {displayedExpenseRows.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  <p className="font-bold text-slate-600">No record found</p>
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 pl-5 pr-4">Expense Title</th>
                        <th className="py-3 pr-4">Category</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedExpenseRows.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pl-5 pr-4 font-bold text-[#0b1f3a]">{e.title}</td>
                          <td className="py-3 pr-4">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                              {e.category}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs font-medium text-slate-500">{e.expense_date}</td>
                          <td className="py-3 pr-5 text-right font-extrabold text-rose-700 tabular-nums">
                            {pkr(Number(e.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
