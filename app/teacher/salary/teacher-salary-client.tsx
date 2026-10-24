"use client";

import { useState } from "react";
import Link from "next/link";
import { MONTHS, pkr } from "@/lib/format";

export interface TeacherPaymentRecord {
  id: string;
  amount: number;
  month: number;
  year: number;
  receipt_no: string;
  paid_at: string;
  method: string | null;
}

export function TeacherSalaryClient({
  period,
  monthlySalary,
  currentPayment,
  history,
}: {
  period: { month: number; year: number; label: string };
  monthlySalary: number;
  currentPayment: TeacherPaymentRecord | null;
  history: TeacherPaymentRecord[];
}) {
  const isPaid = Boolean(currentPayment);
  const [showHistory, setShowHistory] = useState(true);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar: Month & Year */}
      <div className="w-fit rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
        <form method="get" className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="text-xs font-bold text-[#0b1f3a]">Salary Period:</span>
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
            className="rounded-xl bg-[#0b1f3a] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-accent active:scale-95 cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Selected Month Salary Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-brand-navy">Salary Status</h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  {period.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Salary: <b className="text-slate-800 tabular-nums">{pkr(monthlySalary)}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPaid ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Paid · {pkr(Number(currentPayment?.amount || monthlySalary))}
                </span>
                <Link
                  href={`/teacher/salary/receipt/${currentPayment?.id}`}
                  target="_blank"
                  className="rounded-xl bg-[#0b1f3a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-accent transition shadow-xs"
                >
                  Print Receipt →
                </Link>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Unpaid
              </span>
            )}
          </div>
        </div>

        {isPaid && currentPayment?.paid_at && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            <span>Voucher #{currentPayment.receipt_no}</span>
            <span>Disbursed on {new Date(currentPayment.paid_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Salary History Card with Toggle Option */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-sm font-bold text-[#0b1f3a]">Salary History</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {history.length} Record{history.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <span>{showHistory ? "Hide History" : "Show History"}</span>
            <svg
              className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                showHistory ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {showHistory && (
          <div className="mt-4">
            {!history.length ? (
              <p className="py-6 text-center text-xs text-slate-400">No past salary records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-2.5 pr-4">Month</th>
                      <th className="pb-2.5 pr-4">Amount</th>
                      <th className="pb-2.5 pr-4">Status</th>
                      <th className="pb-2.5 pr-4">Date &amp; Method</th>
                      <th className="pb-2.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 pr-4 font-bold text-[#0b1f3a]">
                          {MONTHS[record.month - 1]} {record.year}
                        </td>
                        <td className="py-3 pr-4 font-black tabular-nums text-slate-800">
                          {pkr(record.amount)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Paid
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500">
                          <span>{new Date(record.paid_at).toLocaleDateString()}</span>
                          {record.method && (
                            <span className="ml-1.5 capitalize text-slate-400">({record.method})</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/teacher/salary/receipt/${record.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                          >
                            <span>Receipt</span>
                            <span>→</span>
                          </Link>
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
    </div>
  );
}

