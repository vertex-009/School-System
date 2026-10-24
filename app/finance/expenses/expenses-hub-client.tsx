"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ReportPrintButton } from "@/components/report-print-button";
import { deleteSchoolExpense } from "@/lib/actions";
import { MONTHS, pkr } from "@/lib/format";
import { SCHOOL, getSchoolDisplayName, getSchoolDisplayAddress } from "@/lib/brand";
import { AddSchoolExpenseForm } from "./add-form";

export type ExpenseItem = {
  id: string;
  title: string;
  category: string | null;
  amount: number;
  expense_date: string;
  note?: string | null;
};

export type SchoolInfo = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
} | null;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  utilities: { bg: "bg-sky-100", text: "text-sky-800", bar: "bg-sky-500" },
  transport: { bg: "bg-amber-100", text: "text-amber-800", bar: "bg-amber-500" },
  supplies: { bg: "bg-emerald-100", text: "text-emerald-800", bar: "bg-emerald-500" },
  maintenance: { bg: "bg-purple-100", text: "text-purple-800", bar: "bg-purple-500" },
  stationery: { bg: "bg-indigo-100", text: "text-indigo-800", bar: "bg-indigo-500" },
  salary: { bg: "bg-rose-100", text: "text-rose-800", bar: "bg-rose-500" },
  other: { bg: "bg-slate-100", text: "text-slate-800", bar: "bg-slate-500" },
};

function getCategoryColor(cat: string | null | undefined) {
  const k = String(cat || "other").toLowerCase();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (k.includes(key)) return CATEGORY_COLORS[key];
  }
  return CATEGORY_COLORS.other;
}

export function ExpensesHubClient({
  period,
  expenses,
  school,
  financeName,
  defaultDate,
}: {
  period: { month: number; year: number; label: string; isFuture: boolean };
  expenses: ExpenseItem[];
  school: SchoolInfo;
  financeName: string;
  defaultDate: string;
}) {
  // By default, NEITHER tab is open ("by default open ho jata hai ye asa ni hona chaye adr srf 2 quick links aain bss")
  const [activeTab, setActiveTab] = useState<"add" | "view" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.note && e.note.toLowerCase().includes(q))
    );
  }, [expenses, searchQuery]);

  // Analytics & category distribution
  const analytics = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      const cat = (e.category || "General").trim();
      const existing = map.get(cat) || { total: 0, count: 0 };
      existing.total += Number(e.amount || 0);
      existing.count += 1;
      map.set(cat, existing);
    }

    const items = Array.from(map.entries()).map(([category, val]) => ({
      category,
      total: val.total,
      count: val.count,
      pct: totalAmount > 0 ? Math.round((val.total / totalAmount) * 100) : 0,
    }));

    // Sort by highest amount
    items.sort((a, b) => b.total - a.total);

    const topCategory = items[0] || null;
    const avgExpense = expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0;

    return { items, topCategory, avgExpense };
  }, [expenses, totalAmount]);

  const schoolTitle = getSchoolDisplayName(school?.name);
  const schoolAddress = getSchoolDisplayAddress(school?.address);

  return (
    <div className="space-y-6">
      {/* Official Print Header: only visible when printing */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-center">
        <div className="relative mx-auto mb-2 h-16 w-16 overflow-hidden rounded-xl border border-slate-200">
          <Image src={SCHOOL.logoSrc} alt="" fill sizes="64px" className="object-cover object-center" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          {schoolTitle}
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-600">
          {[schoolAddress, school?.phone].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-3 inline-block rounded-lg bg-slate-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-slate-800">
          Official School Operational Expenses Statement · {period.label}
        </div>
        <div className="mt-3 flex justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 px-2">
          <span>Date Generated: {new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}</span>
          <span>Prepared by: Finance Dashboard ({financeName || "Finance"})</span>
          <span>Total Operational Outflow: {pkr(totalAmount)}</span>
        </div>
      </div>

      {/* Page Header (Screen) - extra description text removed as requested */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-black text-brand-navy">Other Expenses</h1>
        </div>
      </div>

      {/* 2 Quick Links: 1. Add other expenses & 2. View other expenses (Clean, NO extra text) */}
      <div className="grid gap-4 sm:grid-cols-2 print:hidden">
        {/* 1. Add other expenses */}
        <button
          type="button"
          onClick={() => setActiveTab((prev) => (prev === "add" ? null : "add"))}
          className={`group flex items-center justify-between rounded-2xl border p-4 sm:p-5 shadow-xs transition-all active:scale-[0.99] cursor-pointer ${
            activeTab === "add"
              ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-md"
              : "border-slate-200/90 bg-white hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                activeTab === "add"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-100 text-amber-800 group-hover:bg-amber-200"
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-800 transition group-hover:text-amber-800">
              Add other expenses
            </h3>
          </div>
          <span
            className={`inline-flex items-center justify-center rounded-xl px-3 py-1 text-xs font-bold transition ${
              activeTab === "add" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {activeTab === "add" ? "Close ▴" : "Open ▾"}
          </span>
        </button>

        {/* 2. View other expenses */}
        <button
          type="button"
          onClick={() => setActiveTab((prev) => (prev === "view" ? null : "view"))}
          className={`group flex items-center justify-between rounded-2xl border p-4 sm:p-5 shadow-xs transition-all active:scale-[0.99] cursor-pointer ${
            activeTab === "view"
              ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-md"
              : "border-slate-200/90 bg-white hover:border-sky-400 hover:bg-sky-50/30 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                activeTab === "view"
                  ? "bg-[#0b1f3a] text-white shadow-sm"
                  : "bg-sky-100 text-sky-800 group-hover:bg-sky-200"
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-800 transition group-hover:text-brand-navy">
              View other expenses
            </h3>
          </div>
          <span
            className={`inline-flex items-center justify-center rounded-xl px-3 py-1 text-xs font-bold transition ${
              activeTab === "view" ? "bg-[#0b1f3a] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {activeTab === "view" ? "Close ▴" : "Open ▾"}
          </span>
        </button>
      </div>

      {/* Tab 1: Add other expenses Form (Expands only when clicked) */}
      {activeTab === "add" && !period.isFuture && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition animate-fadeIn print:hidden">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-brand-navy">Record New Operational Expense</h2>
              <p className="text-xs text-slate-500">Provide category, amount, date and optional notes.</p>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <AddSchoolExpenseForm defaultDate={defaultDate} />
        </section>
      )}

      {/* Tab 2: View other expenses Table (Expands on Screen & always rendered in Print) */}
      {(activeTab === "view" || typeof window === "undefined") && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition animate-fadeIn print:border-none print:shadow-none">
          {/* Controls Bar: Month / Year Filter, Total Stat, and Print Button */}
          <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 print:hidden">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-black text-brand-navy">
                  Expense Statement · {period.label}
                </h2>
                <p className="text-xs text-slate-500">
                  Total {expenses.length} expense record(s) amounting to <b className="text-rose-700">{pkr(totalAmount)}</b>.
                </p>
              </div>

              {/* Month/Year Filter & Print Button */}
              <div className="flex flex-wrap items-center gap-3">
                <form method="get" className="flex items-center gap-2">
                  <select
                    name="month"
                    defaultValue={String(period.month)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-sky"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    name="year"
                    type="number"
                    min={2000}
                    max={2100}
                    defaultValue={period.year}
                    className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-navy outline-none focus:border-brand-sky"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-accent cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </form>

                <ReportPrintButton label="Print Statement" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="border-b border-slate-100 px-5 py-3 bg-white flex items-center justify-between print:hidden">
            <input
              type="text"
              placeholder="Filter expenses by title, category, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="p-5 print:p-0">
            {filteredExpenses.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                <p className="font-bold text-slate-600">No operational expenses recorded for {period.label}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[650px] print:min-w-full text-left text-xs print:text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500 print:text-slate-900 print:border-b-2 print:border-slate-800">
                      <th className="py-2.5 pr-2">Date</th>
                      <th className="py-2.5 pr-2">Expense Particulars / Title</th>
                      <th className="py-2.5 pr-2">Category</th>
                      <th className="py-2.5 pr-2">Notes / Description</th>
                      <th className="py-2.5 pr-2 text-right">Amount</th>
                      <th className="py-2.5 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                    {filteredExpenses.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition border-b border-slate-100 print:border-slate-300">
                        <td className="py-3 pr-2 whitespace-nowrap font-medium text-slate-600 print:text-slate-900">
                          {r.expense_date}
                        </td>
                        <td className="py-3 pr-2 font-bold text-brand-navy print:text-black">
                          {r.title}
                        </td>
                        <td className="py-3 pr-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 capitalize print:border print:border-slate-300 print:bg-transparent">
                            {r.category || "General"}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-slate-500 print:text-slate-700 max-w-xs truncate">
                          {r.note || "—"}
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums font-black text-rose-700 print:text-black">
                          {pkr(r.amount)}
                        </td>
                        <td className="py-3 text-right print:hidden">
                          <form action={deleteSchoolExpense.bind(null, r.id)}>
                            <button
                              type="submit"
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Remove
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold text-slate-900 bg-slate-50/50 print:bg-transparent">
                      <td colSpan={4} className="py-3 pr-2 text-xs uppercase">
                        Total Operational Expenses ({filteredExpenses.length} records)
                      </td>
                      <td className="py-3 pr-2 text-right tabular-nums text-rose-700 font-black print:text-black">
                        {pkr(filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0))}
                      </td>
                      <td className="print:hidden" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Official Footer in Print (No signature lines needed, display dashboard / issuing portal) */}
          <div className="hidden print:block pt-8 text-center text-xs text-slate-600 border-t border-slate-300 mt-8">
            <p className="font-bold text-slate-900">Issued &amp; Generated by: Finance Dashboard ({financeName || "Finance"})</p>
            <p className="text-[11px] text-slate-500 mt-0.5">City Public School Abbottabad KPK Pakistan · Official School Record</p>
          </div>
        </section>
      )}

      {/* Graphical Representation & Analytics Section (Shown on Screen) */}
      <section className="space-y-4 print:hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </span>
            <h2 className="text-sm font-bold text-[#0b1f3a]">
              Expenses Analytics &amp; Visual Breakdown
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {period.label}
          </span>
        </div>

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/70 via-white to-pink-50/30 p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Total Outflow</span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-rose-900 tabular-nums">
              {pkr(totalAmount)}
            </p>
            <span className="text-[11px] text-slate-500">For {period.label}</span>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/30 p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Transactions</span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-sky-900 tabular-nums">
              {expenses.length}
            </p>
            <span className="text-[11px] text-slate-500">Recorded vouchers</span>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/30 p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Top Category</span>
            <p className="mt-1 text-base sm:text-lg font-black text-amber-900 truncate">
              {analytics.topCategory ? analytics.topCategory.category : "None"}
            </p>
            <span className="text-[11px] text-slate-500">
              {analytics.topCategory ? pkr(analytics.topCategory.total) : "—"}
            </span>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/30 p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Average Outflow</span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-indigo-900 tabular-nums">
              {pkr(analytics.avgExpense)}
            </p>
            <span className="text-[11px] text-slate-500">Per transaction</span>
          </div>
        </div>

        {/* Visual Category Distribution Bar & Legend */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Category Distribution Share
            </h3>
            {analytics.items.length > 0 && (
              <span className="text-xs font-semibold text-slate-600">
                {analytics.items.length} active spending categor{analytics.items.length > 1 ? "ies" : "y"}
              </span>
            )}
          </div>

          {analytics.items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                📊
              </div>
              <p className="font-semibold text-slate-500">No expense distribution data available.</p>
              <p className="text-[11px] mt-0.5">Add an operational expense above to populate the visual chart.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Multi-segment distribution progress bar */}
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                {analytics.items.map((item) => {
                  const color = getCategoryColor(item.category);
                  return (
                    <div
                      key={item.category}
                      style={{ width: `${Math.max(item.pct, 3)}%` }}
                      className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 ${color.bar}`}
                      title={`${item.category}: ${pkr(item.total)} (${item.pct}%)`}
                    />
                  );
                })}
              </div>

              {/* Category details breakdown cards */}
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                {analytics.items.map((item) => {
                  const color = getCategoryColor(item.category);
                  return (
                    <div
                      key={item.category}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-white hover:border-slate-200 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${color.bar}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate capitalize">{item.category}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.count} record{item.count !== 1 ? "s" : ""} · {item.pct}% of total
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black tabular-nums text-slate-900 shrink-0 ml-2">
                        {pkr(item.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
