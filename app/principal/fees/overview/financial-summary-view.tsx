"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

export function FinancialSummaryView({
  tab,
  period,
  // Fee data
  feeBilled,
  feeCollected,
  feeUncollected,
  feeInvoices,
  // Salary data
  salaryDueSum,
  salaryPaidSum,
  salaryRows,
  // Expense data
  expensesTotal,
  schoolExpenses,
  otherExpenses,
  allExpenses,
}: {
  tab: "fees" | "salary" | "expenses";
  period: { month: number; year: number; label: string };
  feeBilled: number;
  feeCollected: number;
  feeUncollected: number;
  feeInvoices: FeeInvoiceItem[];
  salaryDueSum: number;
  salaryPaidSum: number;
  salaryRows: SalaryItem[];
  expensesTotal: number;
  schoolExpenses: number;
  otherExpenses: number;
  allExpenses: ExpenseItem[];
}) {
  // State for Fees Tab: null (closed by default), "paid", or "unpaid"
  const [feeFilter, setFeeFilter] = useState<"paid" | "unpaid" | null>(null);
  const [feeSearch, setFeeSearch] = useState("");

  // State for Salary Tab: null (closed by default), "paid", or "unpaid"
  const [salaryFilter, setSalaryFilter] = useState<"paid" | "unpaid" | null>(null);
  const [salarySearch, setSalarySearch] = useState("");

  // State for Expenses Tab: null (closed by default), "school", or "other"
  const [expenseFilter, setExpenseFilter] = useState<"school" | "other" | null>(null);
  const [expenseSearch, setExpenseSearch] = useState("");

  // Reset all filters when tab or period changes so by default NOTHING is open
  useEffect(() => {
    setFeeFilter(null);
    setFeeSearch("");
    setSalaryFilter(null);
    setSalarySearch("");
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

  // Derived Salary lists
  const paidSalaryRows = salaryRows.filter((s) => s.paidAmt != null);
  const unpaidSalaryRows = salaryRows.filter((s) => s.paidAmt == null);

  const displayedSalaryRows = salaryRows.filter((s) => {
    if (salaryFilter === "paid" && s.paidAmt == null) return false;
    if (salaryFilter === "unpaid" && s.paidAmt != null) return false;
    if (salarySearch.trim()) {
      const q = salarySearch.toLowerCase().trim();
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

  return (
    <div>
      {/* ============================================================ */}
      {/* 1. FEE OVERVIEW TAB                                          */}
      {/* ============================================================ */}
      {tab === "fees" && (
        <div className="space-y-4">
          {/* 3 Stat Cards: Total Fee (box), Paid (clickable), Unpaid (clickable) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Fee - Summary Box (Non-clickable stat box) */}
            <div className="rounded-2xl border border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] to-[#1a5276] p-5 text-white shadow-xs print:border-slate-800 print:bg-slate-50 print:text-black print:shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 print:text-slate-800">
                  Total Fee
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white print:hidden">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums print:text-black">
                  {pkr(feeBilled)}
                </span>
                <span className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {feeInvoices.length} Total
                </span>
              </div>
            </div>

            {/* Card 2: Paid (Clickable) */}
            <button
              type="button"
              onClick={() => setFeeFilter((prev) => (prev === "paid" ? null : "paid"))}
              className={`rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none ${
                feeFilter === "paid"
                  ? "border-emerald-600 bg-emerald-100/80 ring-2 ring-emerald-500/30 shadow-sm"
                  : "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:border-emerald-300 shadow-xs"
              }`}
              title={feeFilter === "paid" ? "Click to close list" : "Click to view Paid fees"}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 print:text-slate-900">
                  Paid
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl print:hidden ${
                    feeFilter === "paid" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums print:text-black">
                  {pkr(feeCollected)}
                </span>
                <span className="text-xs font-bold text-emerald-800 print:text-slate-700">
                  {paidFeeInvoices.length} Paid
                </span>
              </div>
            </button>

            {/* Card 3: Unpaid (Clickable) */}
            <button
              type="button"
              onClick={() => setFeeFilter((prev) => (prev === "unpaid" ? null : "unpaid"))}
              className={`rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none ${
                feeFilter === "unpaid"
                  ? "border-rose-600 bg-rose-100/80 ring-2 ring-rose-500/30 shadow-sm"
                  : "border-rose-200/90 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 hover:border-rose-300 shadow-xs"
              }`}
              title={feeFilter === "unpaid" ? "Click to close list" : "Click to view Unpaid fees"}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 print:text-slate-900">
                  Unpaid
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl print:hidden ${
                    feeFilter === "unpaid" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                </span>
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
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {feeFilter === "paid" ? "Paid Invoices" : "Unpaid Invoices"} ({displayedFeeInvoices.length})
                </span>

                <div className="flex items-center gap-2.5">
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
                                href={`/principal/fees/receipts/${inv.paymentId}`}
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
      {/* 2. SALARIES TAB                                              */}
      {/* ============================================================ */}
      {tab === "salary" && (
        <div className="space-y-4">
          {/* 3 Stat Cards: Total Salary (box), Paid Salaries (clickable), Unpaid Salaries (clickable) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Salary - Summary Box (Non-clickable stat box) */}
            <div className="rounded-2xl border border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] to-[#1a5276] p-5 text-white shadow-xs print:border-slate-800 print:bg-slate-50 print:text-black print:shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 print:text-slate-800">
                  Total Salary
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white print:hidden">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums print:text-black">
                  {pkr(salaryDueSum)}
                </span>
                <span className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {salaryRows.length} Staff
                </span>
              </div>
            </div>

            {/* Card 2: Paid Salaries (Clickable) */}
            <button
              type="button"
              onClick={() => setSalaryFilter((prev) => (prev === "paid" ? null : "paid"))}
              className={`rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none ${
                salaryFilter === "paid"
                  ? "border-emerald-600 bg-emerald-100/80 ring-2 ring-emerald-500/30 shadow-sm"
                  : "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:border-emerald-300 shadow-xs"
              }`}
              title={salaryFilter === "paid" ? "Click to close list" : "Click to view Paid Salaries"}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 print:text-slate-900">
                  Paid Salaries
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl print:hidden ${
                    salaryFilter === "paid" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums print:text-black">
                  {pkr(salaryPaidSum)}
                </span>
                <span className="text-xs font-bold text-emerald-800 print:text-slate-700">
                  {paidSalaryRows.length} Paid
                </span>
              </div>
            </button>

            {/* Card 3: Unpaid Salaries (Clickable) */}
            <button
              type="button"
              onClick={() => setSalaryFilter((prev) => (prev === "unpaid" ? null : "unpaid"))}
              className={`rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none ${
                salaryFilter === "unpaid"
                  ? "border-amber-600 bg-amber-100/80 ring-2 ring-amber-500/30 shadow-sm"
                  : "border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:border-amber-300 shadow-xs"
              }`}
              title={salaryFilter === "unpaid" ? "Click to close list" : "Click to view Unpaid Salaries"}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 print:text-slate-900">
                  Unpaid Salaries
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl print:hidden ${
                    salaryFilter === "unpaid" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-amber-800 tabular-nums print:text-black">
                  {pkr(Math.max(salaryDueSum - salaryPaidSum, 0))}
                </span>
                <span className="text-xs font-bold text-amber-800 print:text-slate-700">
                  {unpaidSalaryRows.length} Pending
                </span>
              </div>
            </button>
          </div>

          {/* Print-only summary overview when no individual list is clicked */}
          {salaryFilter === null && (
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
                    <td className="p-2 font-bold border-r border-slate-200">Total Booked Salaries</td>
                    <td className="p-2 text-center border-r border-slate-200">{salaryRows.length}</td>
                    <td className="p-2 text-right font-bold">{pkr(salaryDueSum)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-emerald-800">Total Salaries Paid</td>
                    <td className="p-2 text-center border-r border-slate-200">{paidSalaryRows.length}</td>
                    <td className="p-2 text-right font-bold text-emerald-800">{pkr(salaryPaidSum)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-slate-200 text-amber-800">Total Salaries Pending / Unpaid</td>
                    <td className="p-2 text-center border-r border-slate-200">{unpaidSalaryRows.length}</td>
                    <td className="p-2 text-right font-bold text-amber-800">{pkr(Math.max(salaryDueSum - salaryPaidSum, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Directory Table - ONLY displayed when user clicks a card */}
          {salaryFilter !== null && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs animate-fadeIn">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    salaryFilter === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {salaryFilter === "paid" ? "Paid Salaries" : "Unpaid Salaries"} ({displayedSalaryRows.length})
                </span>

                <div className="flex items-center gap-2.5 print:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search staff by name/role…"
                      value={salarySearch}
                      onChange={(e) => setSalarySearch(e.target.value)}
                      className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition"
                    />
                    {salarySearch && (
                      <button
                        type="button"
                        onClick={() => setSalarySearch("")}
                        className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSalaryFilter(null)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    title="Close list"
                  >
                    <span>Close</span>
                    <span>✕</span>
                  </button>
                </div>
              </div>

              {displayedSalaryRows.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  <p className="font-bold text-slate-600">No record found</p>
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 pl-5 pr-4">Staff Member</th>
                        <th className="py-3 pr-4">Role / Job</th>
                        <th className="py-3 pr-4">Monthly Salary</th>
                        <th className="py-3 pr-5 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedSalaryRows.map((s) => (
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
      {/* 3. OTHER EXPENSES TAB                                        */}
      {/* ============================================================ */}
      {tab === "expenses" && (
        <div className="space-y-4">
          {/* 3 Stat Cards: Total Expenses (box), School Expenses (clickable), Other Expenses (clickable) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Expenses - Summary Box (Non-clickable stat box) */}
            <div className="rounded-2xl border border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] to-[#1a5276] p-5 text-white shadow-xs print:border-slate-800 print:bg-slate-50 print:text-black print:shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 print:text-slate-800">
                  Total Expenses
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white print:hidden">
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
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums print:text-black">
                  - {pkr(expensesTotal)}
                </span>
                <span className="text-xs font-semibold text-slate-300 print:text-slate-700">
                  {allExpenses.length} Entries
                </span>
              </div>
            </div>

            {/* Card 2: School Expenses (Clickable) */}
            <button
              type="button"
              onClick={() => setExpenseFilter((prev) => (prev === "school" ? null : "school"))}
              className={`rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none ${
                expenseFilter === "school"
                  ? "border-rose-600 bg-rose-100/80 ring-2 ring-rose-500/30 shadow-sm"
                  : "border-rose-200/90 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 hover:border-rose-300 shadow-xs"
              }`}
              title={expenseFilter === "school" ? "Click to close list" : "Click to view School Expenses"}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 print:text-slate-900">
                  School Expenses
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl print:hidden ${
                    expenseFilter === "school" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </span>
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

            {/* Card 3: Other Expenses (Clickable) */}
            <button
              type="button"
              onClick={() => setExpenseFilter((prev) => (prev === "other" ? null : "other"))}
              className={`rounded-2xl border p-5 text-left transition cursor-pointer print:border-slate-800 print:bg-white print:shadow-none ${
                expenseFilter === "other"
                  ? "border-amber-600 bg-amber-100/80 ring-2 ring-amber-500/30 shadow-sm"
                  : "border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:border-amber-300 shadow-xs"
              }`}
              title={expenseFilter === "other" ? "Click to close list" : "Click to view Other Expenses"}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 print:text-slate-900">
                  Other Expenses
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl print:hidden ${
                    expenseFilter === "other" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
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
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {expenseFilter === "school" ? "School Expenses" : "Other Expenses"} ({displayedExpenseRows.length})
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
