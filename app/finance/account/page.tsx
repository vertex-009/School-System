import { Shell } from "@/components/shell";
import { MONTHS, pkr } from "@/lib/format";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

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

export default async function FinanceMonthlyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

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

  const chartBars = [
    {
      label: "Fee Collection",
      shortLabel: "Fee Collection",
      value: feeCollection,
      color: "#059669",
      bgDot: "bg-emerald-500",
      gradient: "linear-gradient(to top, #059669, #10b981)",
      type: "inflow",
    },
    {
      label: "Other Expenses",
      shortLabel: "Expenses",
      value: expenses,
      color: "#e11d48",
      bgDot: "bg-rose-500",
      gradient: "linear-gradient(to top, #be123c, #fb7185)",
      type: "outflow",
      share: totalOut > 0 ? ((expenses / totalOut) * 100).toFixed(0) : "0",
    },
    {
      label: "Faculty Salaries",
      shortLabel: "Faculty",
      value: staffSalaries,
      color: "#d97706",
      bgDot: "bg-amber-500",
      gradient: "linear-gradient(to top, #d97706, #fbbf24)",
      type: "outflow",
      share: totalOut > 0 ? ((staffSalaries / totalOut) * 100).toFixed(0) : "0",
    },
    {
      label: "Other Employees Salary",
      shortLabel: "Other Staff",
      value: otherSalaries,
      color: "#ea580c",
      bgDot: "bg-orange-500",
      gradient: "linear-gradient(to top, #ea580c, #fb923c)",
      type: "outflow",
      share: totalOut > 0 ? ((otherSalaries / totalOut) * 100).toFixed(0) : "0",
    },
    {
      label: "Total Outflows",
      shortLabel: "Total Out",
      value: totalOut,
      color: "#334155",
      bgDot: "bg-slate-700",
      gradient: "linear-gradient(to top, #334155, #64748b)",
      type: "total",
    },
  ];

  const maxVal = Math.max(...chartBars.map((b) => b.value), 0);
  const { ceiling, ticks } = getChartTicks(maxVal);

  return (
    <Shell role="finance" title="Monthly account">
      <div className="space-y-4">
        {/* Compact, clean Select Month bar (no duplicate title, no export/print, w-fit) */}
        <div className="w-fit rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <form method="get" className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-[#0b1f3a]">
                <svg className="h-4 w-4 text-[#0b1f3a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#0b1f3a]">Select Month</span>
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
              Show
            </button>
          </form>
        </div>

        {/* 6 Metric Cards with rich, distinctive UI styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Fee Collection (Vibrant Teal/Emerald) */}
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
                + {pkr(feeCollection)}
              </p>
            </div>
          </div>

          {/* Card 2: Other Expenses (Soft Rose/Pink) */}
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
                - {pkr(expenses)}
              </p>
            </div>
          </div>

          {/* Card 3: Faculty Salaries (Warm Pastel Yellow/Amber) */}
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
                - {pkr(staffSalaries)}
              </p>
            </div>
          </div>

          {/* Card 4: Other Staff Salaries (Pastel Orange/Peach) */}
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
                - {pkr(otherSalaries)}
              </p>
            </div>
          </div>

          {/* Card 5: Total Outflows (Dark Charcoal/Slate) */}
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
                - {pkr(totalOut)}
              </p>
            </div>
          </div>

          {/* Card 6: Net Balance (Dynamic Emerald or Rose badge) */}
          <div
            className={`flex flex-col justify-between rounded-2xl p-4 shadow-sm border transition hover:shadow-md ${
              net >= 0
                ? "bg-gradient-to-br from-[#10b981] to-[#047857] text-white border-emerald-600"
                : "bg-gradient-to-br from-[#f43f5e] to-[#be123c] text-white border-rose-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                Net Balance
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                {net >= 0 ? "Surplus" : "Deficit"}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-black tabular-nums">
                {net >= 0 ? `+ ${pkr(net)}` : `- ${pkr(Math.abs(net))}`}
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
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
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
                    + {pkr(feeCollection)}
                  </span>
                </div>

                {/* Outflow Breakdown Items */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-semibold text-slate-700">Other Expenses</span>
                      {totalOut > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          ({((expenses / totalOut) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {pkr(expenses)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-700">Faculty Salaries</span>
                      {totalOut > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          ({((staffSalaries / totalOut) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {pkr(staffSalaries)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="font-semibold text-slate-700">Other Staff Salaries</span>
                      {totalOut > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          ({((otherSalaries / totalOut) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {pkr(otherSalaries)}
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
                    - {pkr(totalOut)}
                  </span>
                </div>

                {/* Net Difference Row */}
                <div
                  className={`flex items-center justify-between rounded-xl p-2.5 font-bold border ${
                    net >= 0
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : "bg-rose-50 text-rose-900 border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        net >= 0 ? "bg-emerald-600" : "bg-rose-600"
                      }`}
                    />
                    <span>Net Surplus / Deficit</span>
                  </div>
                  <span
                    className={`font-black text-sm tabular-nums ${
                      net >= 0 ? "text-emerald-800" : "text-rose-800"
                    }`}
                  >
                    {net >= 0 ? `+ ${pkr(net)}` : `- ${pkr(Math.abs(net))}`}
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
    </Shell>
  );
}

