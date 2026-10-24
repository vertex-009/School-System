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
    <Shell role="principal" title="Monthly account">
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

          {/* Card 4: Other Employees Salary (Soft Coral/Orange) */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#ffedd5] border border-[#fed7aa] text-[#9a3412] p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9a3412]">
                Other Employees Salary
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fed7aa]/80 text-[#c2410c]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-black text-[#c2410c] tabular-nums">
                - {pkr(otherSalaries)}
              </p>
            </div>
          </div>

          {/* Card 5: Total Outflows (Slate/Steel Blue) */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#475569] border border-[#334155] text-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Total Outflows
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                {pkr(totalOut)}
              </p>
            </div>
          </div>

          {/* Card 6: Net Balance (Hero Navy Midnight Card with Emerald Glow) */}
          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#061426] via-[#092240] to-[#0f345e] text-white border-2 border-emerald-400/40 p-4 shadow-md transition hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
                Net Balance:
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${
                  net >= 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                }`}
              >
                {net >= 0 ? "Surplus" : "Deficit"}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                {pkr(net)}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Financial Breakdown Chart Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b1f3a] text-white text-xs shadow-2xs">
                  📊
                </span>
                <h2 className="text-sm font-black text-[#0b1f3a]">
                  Breakdown
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  net >= 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${net >= 0 ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
                Net: {pkr(net)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Scale: {formatCompact(ceiling)}
              </span>
            </div>
          </div>

          {period.isFuture ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400">
              Cannot calculate breakdown for a future month ({period.label}).
            </div>
          ) : maxVal === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400">
              No financial transactions recorded for {period.label}.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Left Column: Compact, Professional Chart (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
                <div className="h-48 sm:h-52 relative flex flex-col justify-between">
                  {/* Horizontal Gridlines & Y-Axis Scale */}
                  <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                    {ticks.map((t, idx) => (
                      <div key={idx} className="relative flex items-center w-full">
                        <span className="w-10 text-right pr-2 text-[10px] font-bold text-slate-400 tabular-nums shrink-0">
                          {formatCompact(t)}
                        </span>
                        <div className="flex-1 border-b border-slate-200/60 border-dashed" />
                      </div>
                    ))}
                  </div>

                  {/* Vertical Bars Container */}
                  <div className="relative z-10 flex items-end justify-between h-full pl-10 pr-2 pb-6">
                    {chartBars.map((bar, idx) => {
                      const heightPercent = ceiling > 0 ? Math.min(Math.round((bar.value / ceiling) * 100), 100) : 0;
                      return (
                        <div
                          key={idx}
                          className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[85px] px-1 transition-all"
                          title={`${bar.label}: ${pkr(bar.value)}`}
                        >
                          {/* Top Value Badge */}
                          <div className="mb-1.5 text-center transition-transform group-hover:-translate-y-0.5">
                            <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-800 shadow-2xs border border-slate-200/80 tabular-nums">
                              {formatCompact(bar.value)}
                            </span>
                          </div>

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
                    Expenditure & Revenue Summary
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
                        <span className="font-semibold text-slate-700">Other Employees Salary</span>
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

                  {/* Total Outflow & Net Divider */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-700 shrink-0" />
                        <span className="font-bold text-slate-800">Total Outflows</span>
                      </div>
                      <span className="font-black text-slate-900 tabular-nums">
                        - {pkr(totalOut)}
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-between rounded-xl p-2.5 font-bold ${
                        net >= 0
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-rose-50 text-rose-900 border border-rose-200"
                      }`}
                    >
                      <span className="text-xs font-black">Net Balance</span>
                      <span className="text-sm font-black tabular-nums">
                        {net >= 0 ? `+ ${pkr(net)}` : pkr(net)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
