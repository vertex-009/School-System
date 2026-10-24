"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ReportPrintButton } from "@/components/report-print-button";
import { classNameOf } from "@/lib/class-label";
import { MONTHS, pkr } from "@/lib/format";
import { SCHOOL } from "@/lib/brand";

export type StudentBit = {
  id?: string;
  name?: string;
  admission_no?: string;
  roll_no?: number | null;
  sections?: unknown;
};

export type InvoiceRow = {
  id: string;
  student_id: string;
  amount: number;
  discount: number | null;
  paid_amount: number | null;
  status: string;
  month: number;
  year: number;
  students: StudentBit | null;
};

export type SchoolInfo = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
} | null;

export function CollectionHistoryClient({
  period,
  rows,
  paid,
  unpaid,
  paymentsMap,
  school,
  financeName,
}: {
  period: { month: number; year: number; label: string };
  rows: InvoiceRow[];
  paid: InvoiceRow[];
  unpaid: InvoiceRow[];
  paymentsMap: Record<string, { id: string; paid_at: string }>;
  school: SchoolInfo;
  financeName: string;
}) {
  // By default, neither Paid nor Unpaid is open
  const [activeView, setActiveView] = useState<"paid" | "unpaid" | null>(null);

  const totalBilled = rows.reduce((acc, r) => acc + (Number(r.amount) - Number(r.discount || 0)), 0);
  const totalCollected = paid.reduce((acc, r) => acc + Number(r.paid_amount || 0), 0) +
    unpaid.reduce((acc, r) => acc + Number(r.paid_amount || 0), 0);
  const totalUnpaid = unpaid.reduce((acc, r) => {
    const fee = Number(r.amount) - Number(r.discount || 0);
    const p = Number(r.paid_amount || 0);
    return acc + Math.max(fee - p, 0);
  }, 0);

  const recoveryRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Official Print Header: only visible when printing */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-center">
        <div className="relative mx-auto mb-2 h-16 w-16 overflow-hidden rounded-xl border border-slate-200">
          <Image src={SCHOOL.logoSrc} alt="" fill sizes="64px" className="object-cover object-center" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          City Public School
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-700">
          Abbottabad, KPK, Pakistan
        </p>
        <div className="mt-3 inline-block rounded-lg bg-slate-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-slate-800">
          Official Fee Collection Record · {period.label}
        </div>
        <div className="mt-3 flex justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 px-2">
          <span>Date Generated: {new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}</span>
          <span>Prepared by: {financeName || "Finance Department"}</span>
          <span>Total Billed: {pkr(totalBilled)} | Total Collected: {pkr(totalCollected)}</span>
        </div>
      </div>

      {/* 1. TOP BOX: Monthly Fee Collection Record */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs print:border-none print:p-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-white shadow-xs">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-black text-brand-navy">Monthly Fee Collection Record</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Summary statement &amp; performance for <b className="text-slate-800">{period.label}</b>
                </p>
              </div>
            </div>
          </div>

          {/* Month/Year Filter & Print Button */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
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
                Show
              </button>
            </form>
            <ReportPrintButton label="Print Record" />
          </div>
        </div>

        {/* Metric Cards inside Top Box */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Invoiced</span>
            <p className="mt-1 text-lg font-black text-brand-navy">{pkr(totalBilled)}</p>
            <p className="text-[11px] text-slate-500">{rows.length} students</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Fee Collected</span>
            <p className="mt-1 text-lg font-black text-emerald-800">{pkr(totalCollected)}</p>
            <p className="text-[11px] text-emerald-600 font-medium">{paid.length} cleared</p>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wide text-rose-700">Outstanding Balance</span>
            <p className="mt-1 text-lg font-black text-rose-800">{pkr(totalUnpaid)}</p>
            <p className="text-[11px] text-rose-600 font-medium">{unpaid.length} pending</p>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wide text-sky-700">Recovery Rate</span>
            <p className="mt-1 text-lg font-black text-sky-900">{recoveryRate}%</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sky-200">
              <div
                className="h-full rounded-full bg-sky-600 transition-all duration-500"
                style={{ width: `${Math.min(100, recoveryRate)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TWO QUICK LINKS: 1 Paid & 2 Unpaid (Neither open by default) */}
      <section className="print:hidden">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Quick Link 1: Paid */}
          <div
            onClick={() => setActiveView((prev) => (prev === "paid" ? null : "paid"))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveView((prev) => (prev === "paid" ? null : "paid"));
              }
            }}
            className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-5 shadow-xs transition-all active:scale-[0.99] select-none ${
              activeView === "paid"
                ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                : "border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-emerald-50/20"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                  activeView === "paid"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200"
                }`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-800">Paid Fees</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                    {paid.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total Collected: <b className="text-emerald-700">{pkr(totalCollected)}</b>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeView === "paid"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800"
                }`}
              >
                <span>{activeView === "paid" ? "Hide" : "View"}</span>
                <span>{activeView === "paid" ? "▴" : "▾"}</span>
              </span>
            </div>
          </div>

          {/* Quick Link 2: Unpaid */}
          <div
            onClick={() => setActiveView((prev) => (prev === "unpaid" ? null : "unpaid"))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveView((prev) => (prev === "unpaid" ? null : "unpaid"));
              }
            }}
            className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-5 shadow-xs transition-all active:scale-[0.99] select-none ${
              activeView === "unpaid"
                ? "border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20"
                : "border-slate-200/90 bg-white hover:border-rose-300 hover:bg-rose-50/20"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                  activeView === "unpaid"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-rose-100 text-rose-800 group-hover:bg-rose-200"
                }`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-800">Unpaid Fees</h3>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-800">
                    {unpaid.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Outstanding: <b className="text-rose-700">{pkr(totalUnpaid)}</b>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeView === "unpaid"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-700 group-hover:bg-rose-100 group-hover:text-rose-800"
                }`}
              >
                <span>{activeView === "unpaid" ? "Hide" : "View"}</span>
                <span>{activeView === "unpaid" ? "▴" : "▾"}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE RECORD DETAILS (Shown on click, relative to selected link) */}
      {activeView === "paid" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition animate-fadeIn">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-brand-navy">
                Paid Fee Records · {period.label}
              </h3>
              <p className="text-xs text-slate-500">
                {paid.length} invoice(s) cleared · Fee receipts available for print
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-right">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Total Collected</span>
              <p className="text-sm font-black text-emerald-800">{pkr(totalCollected)}</p>
            </div>
          </div>

          <div className="p-5">
            {!paid.length ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No paid fee records found for {period.label}.
              </p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[760px] print:min-w-full text-left text-sm print:text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                      <th className="py-2.5 pr-2">Student Name</th>
                      <th className="py-2.5 pr-2">Roll</th>
                      <th className="py-2.5 pr-2">Admission</th>
                      <th className="py-2.5 pr-2">Class</th>
                      <th className="py-2.5 pr-2">Month</th>
                      <th className="py-2.5 pr-2">Billed Fee</th>
                      <th className="py-2.5 pr-2">Paid</th>
                      <th className="py-2.5 pr-2">Status</th>
                      <th className="py-2.5 text-right print:hidden">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paid.map((inv) => {
                      const s = inv.students;
                      const fee = Number(inv.amount) - Number(inv.discount || 0);
                      const paidAmount = Number(inv.paid_amount || 0);
                      const payment = paymentsMap[inv.id];
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 pr-2 font-bold text-brand-navy">{s?.name || "—"}</td>
                          <td className="py-2.5 pr-2">{s?.roll_no ?? "—"}</td>
                          <td className="py-2.5 pr-2 font-mono text-xs">{s?.admission_no || "—"}</td>
                          <td className="py-2.5 pr-2">{classNameOf(s?.sections)}</td>
                          <td className="py-2.5 pr-2 whitespace-nowrap">{period.label}</td>
                          <td className="py-2.5 pr-2 tabular-nums">{pkr(fee)}</td>
                          <td className="py-2.5 pr-2 tabular-nums font-bold text-emerald-700">{pkr(paidAmount)}</td>
                          <td className="py-2.5 pr-2">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
                              Paid
                            </span>
                          </td>
                          <td className="py-2.5 text-right print:hidden">
                            {payment ? (
                              <div className="inline-flex flex-col items-end gap-0.5">
                                <Link
                                  href={`/finance/fees/receipts/${payment.id}`}
                                  target="_blank"
                                  className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-accent transition shadow-xs"
                                >
                                  Print receipt
                                </Link>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(payment.paid_at).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold text-slate-900 bg-slate-50/50">
                      <td colSpan={5} className="py-3 pr-2 text-xs uppercase">Total Paid Records ({paid.length})</td>
                      <td className="py-3 pr-2 tabular-nums">
                        {pkr(paid.reduce((acc, r) => acc + (Number(r.amount) - Number(r.discount || 0)), 0))}
                      </td>
                      <td className="py-3 pr-2 tabular-nums text-emerald-700 font-black">{pkr(totalCollected)}</td>
                      <td colSpan={2} className="py-3 pr-2" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeView === "unpaid" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition animate-fadeIn">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-brand-navy">
                Unpaid &amp; Pending Fee Invoices · {period.label}
              </h3>
              <p className="text-xs text-slate-500">
                {unpaid.length} invoice(s) pending payment · Quick collect cash links available
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-right">
              <span className="text-[10px] font-bold uppercase text-rose-700">Total Outstanding</span>
              <p className="text-sm font-black text-rose-800">{pkr(totalUnpaid)}</p>
            </div>
          </div>

          <div className="p-5">
            {!unpaid.length ? (
              <p className="py-6 text-center text-sm text-emerald-600 font-semibold">
                ✓ All fees are cleared! No unpaid invoices found for {period.label}.
              </p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[760px] print:min-w-full text-left text-sm print:text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                      <th className="py-2.5 pr-2">Student Name</th>
                      <th className="py-2.5 pr-2">Roll</th>
                      <th className="py-2.5 pr-2">Admission</th>
                      <th className="py-2.5 pr-2">Class</th>
                      <th className="py-2.5 pr-2">Month</th>
                      <th className="py-2.5 pr-2">Total Fee</th>
                      <th className="py-2.5 pr-2">Paid</th>
                      <th className="py-2.5 pr-2">Remaining Due</th>
                      <th className="py-2.5 pr-2">Status</th>
                      <th className="py-2.5 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unpaid.map((inv) => {
                      const s = inv.students;
                      const fee = Number(inv.amount) - Number(inv.discount || 0);
                      const paidPart = Number(inv.paid_amount || 0);
                      const due = Math.max(fee - paidPart, 0);
                      const statusLabel = inv.status === "partial" ? "Partial" : "Unpaid";
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 pr-2 font-bold text-brand-navy">{s?.name || "—"}</td>
                          <td className="py-2.5 pr-2">{s?.roll_no ?? "—"}</td>
                          <td className="py-2.5 pr-2 font-mono text-xs">{s?.admission_no || "—"}</td>
                          <td className="py-2.5 pr-2">{classNameOf(s?.sections)}</td>
                          <td className="py-2.5 pr-2 whitespace-nowrap">{period.label}</td>
                          <td className="py-2.5 pr-2 tabular-nums">{pkr(fee)}</td>
                          <td className="py-2.5 pr-2 tabular-nums text-slate-600">{pkr(paidPart)}</td>
                          <td className="py-2.5 pr-2 tabular-nums font-bold text-rose-700">{pkr(due)}</td>
                          <td className="py-2.5 pr-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${
                                inv.status === "partial"
                                  ? "bg-amber-50 text-amber-800 border-amber-200/60"
                                  : "bg-rose-50 text-rose-800 border-rose-200/60"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-2.5 text-right print:hidden">
                            {s?.id ? (
                              <Link
                                href={`/finance/collect?student_id=${s.id}&q=${encodeURIComponent(s.name || "")}&month=${period.month}&year=${period.year}`}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-navy hover:bg-brand-navy hover:text-white transition shadow-2xs"
                              >
                                Collect Fee →
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold text-slate-900 bg-slate-50/50">
                      <td colSpan={5} className="py-3 pr-2 text-xs uppercase">Total Unpaid Records ({unpaid.length})</td>
                      <td className="py-3 pr-2 tabular-nums">
                        {pkr(unpaid.reduce((acc, r) => acc + (Number(r.amount) - Number(r.discount || 0)), 0))}
                      </td>
                      <td className="py-3 pr-2 tabular-nums text-slate-700">
                        {pkr(unpaid.reduce((acc, r) => acc + Number(r.paid_amount || 0), 0))}
                      </td>
                      <td className="py-3 pr-2 tabular-nums text-rose-700 font-black">{pkr(totalUnpaid)}</td>
                      <td colSpan={2} className="py-3 pr-2" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Official Footer in Print */}
      <div className="hidden print:block pt-8 text-center text-xs text-slate-600 border-t border-slate-300 mt-8">
        <p className="font-bold text-slate-900">Issued &amp; Generated by: Finance Dashboard ({financeName || "Finance"})</p>
        <p className="text-[11px] text-slate-500 mt-0.5">City Public School Abbottabad KPK Pakistan · Official Fee Record</p>
      </div>
    </div>
  );
}

