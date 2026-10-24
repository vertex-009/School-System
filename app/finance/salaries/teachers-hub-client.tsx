"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStaffSalary, paySalary } from "@/lib/actions";
import { MONTHS, pkr } from "@/lib/format";

export type TeacherSalaryItem = {
  id: string;
  name: string;
  email?: string | null;
  phone: string | null;
  role: string;
  monthly_salary: number;
  is_active: boolean;
  joined_on: string | null;
  left_on: string | null;
  isPaid: boolean;
  paymentId: string | null;
  receipt: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  method: string | null;
};

export type TeacherPaymentLogItem = {
  id: string;
  teacher_id: string;
  name: string;
  email?: string | null;
  role: string;
  amount: number;
  method: string | null;
  receipt: string;
  paid_at: string;
  monthLabel: string;
};

export function TeachersHubClient({
  period,
  teachers,
  paymentLog,
  allTeachers,
}: {
  period: { month: number; year: number; label: string };
  teachers: TeacherSalaryItem[];
  paymentLog: TeacherPaymentLogItem[];
  allTeachers: TeacherSalaryItem[];
}) {
  const router = useRouter();

  // 3 Quick Links: "add" | "pay" | "directory". Default open: "pay"
  const [activeTab, setActiveTab] = useState<"add" | "pay" | "directory" | null>("pay");
  // Collapsible History at bottom: toggleable
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Set Salary Modal state
  const [settingTeacher, setSettingTeacher] = useState<TeacherSalaryItem | null>(null);
  const [salaryInput, setSalaryInput] = useState<number>(0);
  const [settingPending, setSettingPending] = useState(false);
  const [settingFeedback, setSettingFeedback] = useState<{ ok?: boolean; error?: string } | null>(null);

  // Pay Salary Modal state
  const [payingTeacher, setPayingTeacher] = useState<TeacherSalaryItem | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [payingMethod, setPayingMethod] = useState<string>("cash");
  const [payingPending, setPayingPending] = useState(false);
  const [payingFeedback, setPayingFeedback] = useState<{ ok?: boolean; error?: string } | null>(null);

  // Handlers for Set Salary
  const openSetSalary = (teacher: TeacherSalaryItem) => {
    setSettingTeacher(teacher);
    setSalaryInput(teacher.monthly_salary);
    setSettingFeedback(null);
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingTeacher) return;
    setSettingPending(true);
    setSettingFeedback(null);
    try {
      const res = await setStaffSalary(settingTeacher.id, "teachers", salaryInput);
      if (res?.ok) {
        setSettingFeedback({ ok: true });
        settingTeacher.monthly_salary = salaryInput;
        setTimeout(() => {
          setSettingTeacher(null);
          router.refresh();
        }, 1000);
      } else {
        setSettingFeedback({ error: res?.error || "Failed to update salary" });
      }
    } catch (err: unknown) {
      setSettingFeedback({ error: err instanceof Error ? err.message : "Error saving salary" });
    } finally {
      setSettingPending(false);
    }
  };

  // Handlers for Pay Salary
  const openPaySalary = (teacher: TeacherSalaryItem) => {
    setPayingTeacher(teacher);
    setPayingAmount(teacher.monthly_salary);
    setPayingMethod("cash");
    setPayingFeedback(null);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingTeacher) return;
    setPayingPending(true);
    setPayingFeedback(null);
    const fd = new FormData();
    fd.set("teacher_id", payingTeacher.id);
    fd.set("amount", String(payingAmount));
    fd.set("method", payingMethod);
    fd.set("month", String(period.month));
    fd.set("year", String(period.year));

    try {
      const res = await paySalary(fd);
      if (res?.error) {
        setPayingFeedback({ error: res.error });
      } else {
        setPayingFeedback({ ok: true });
        setTimeout(() => {
          setPayingTeacher(null);
          router.refresh();
        }, 1000);
      }
    } catch (err: unknown) {
      setPayingFeedback({ error: err instanceof Error ? err.message : "Error paying salary" });
    } finally {
      setPayingPending(false);
    }
  };

  // Filter teachers for pay tab
  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.email && t.email.toLowerCase().includes(q)) || (t.phone && t.phone.includes(q));
  });

  const paidCount = teachers.filter((t) => t.isPaid).length;
  const unpaidCount = teachers.filter((t) => !t.isPaid).length;
  const totalBilled = teachers.reduce((sum, t) => sum + t.monthly_salary, 0);
  const totalPaid = teachers.filter((t) => t.isPaid).reduce((sum, t) => sum + (t.paidAmount || t.monthly_salary), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy">Teachers Salary</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage teacher salaries, set monthly compensation directly in rows, disburse salaries, and inspect history.
          </p>
        </div>
      </div>

      {/* 3 Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* 1. Add Teacher */}
        <div
          onClick={() => setActiveTab((prev) => (prev === "add" ? null : "add"))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab((prev) => (prev === "add" ? null : "add"));
            }
          }}
          className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-5 shadow-xs transition-all active:scale-[0.99] select-none ${
            activeTab === "add"
              ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
              : "border-slate-200/90 bg-white hover:border-amber-300 hover:bg-amber-50/20"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                activeTab === "add"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-100 text-amber-800 group-hover:bg-amber-200"
              }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Add Teacher</h3>
              <p className="text-xs text-slate-500 mt-0.5">Faculty registration &amp; credentials</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              activeTab === "add" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {activeTab === "add" ? "▴" : "▾"}
          </span>
        </div>

        {/* 2. Pay Salary */}
        <div
          onClick={() => setActiveTab((prev) => (prev === "pay" ? null : "pay"))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab((prev) => (prev === "pay" ? null : "pay"));
            }
          }}
          className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-5 shadow-xs transition-all active:scale-[0.99] select-none ${
            activeTab === "pay"
              ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
              : "border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-emerald-50/20"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                activeTab === "pay"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200"
              }`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800">Pay Salary</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                  {period.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Set in row &amp; pay salary ({unpaidCount} pending)
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              activeTab === "pay" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {activeTab === "pay" ? "▴" : "▾"}
          </span>
        </div>

        {/* 3. Teachers Directory */}
        <div
          onClick={() => setActiveTab((prev) => (prev === "directory" ? null : "directory"))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab((prev) => (prev === "directory" ? null : "directory"));
            }
          }}
          className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-5 shadow-xs transition-all active:scale-[0.99] select-none ${
            activeTab === "directory"
              ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20"
              : "border-slate-200/90 bg-white hover:border-sky-300 hover:bg-sky-50/20"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                activeTab === "directory"
                  ? "bg-[#0b1f3a] text-white shadow-sm"
                  : "bg-sky-100 text-sky-800 group-hover:bg-sky-200"
              }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800">Teachers Directory</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                  {allTeachers.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">View all faculty members and salaries</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              activeTab === "directory" ? "bg-[#0b1f3a] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {activeTab === "directory" ? "▴" : "▾"}
          </span>
        </div>
      </div>

      {/* Tab 1: Add Teacher Info / Quick Action */}
      {activeTab === "add" && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition animate-fadeIn">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-brand-navy">Add / Register Teacher</h2>
              <p className="text-xs text-slate-500">Teacher login credentials and profile setup.</p>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-5 text-sm text-slate-700">
            <h4 className="font-bold text-brand-navy mb-1">Faculty Account Creation</h4>
            <p className="text-xs text-slate-600 mb-3">
              Teacher accounts are provisioned with official system login credentials. You can set and manage their monthly compensation directly in the <b>Pay Salary</b> tab once created.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/principal/teachers/new"
                className="rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-accent transition shadow-xs"
              >
                Go to Teacher Registration →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Pay Salary View (With "Set Salary" in each row) */}
      {activeTab === "pay" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition animate-fadeIn">
          {/* Controls Bar: Month / Year Filter & Quick Stats */}
          <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-black text-brand-navy">
                  Teacher Salary Disbursement · {period.label}
                </h2>
                <p className="text-xs text-slate-500">
                  Set monthly salaries directly in rows and disburse monthly payments.
                </p>
              </div>

              {/* Month/Year Filter Form */}
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
            </div>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Teachers</span>
                <p className="text-lg font-black text-brand-navy mt-0.5">{teachers.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Paid Teachers</span>
                <p className="text-lg font-black text-emerald-800 mt-0.5">{paidCount}</p>
              </div>
              <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-amber-700">Unpaid / Pending</span>
                <p className="text-lg font-black text-amber-800 mt-0.5">{unpaidCount}</p>
              </div>
              <div className="rounded-xl bg-sky-50/50 border border-sky-100 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-sky-700">Total Budget</span>
                <p className="text-lg font-black text-sky-900 mt-0.5">{pkr(totalBilled)}</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="border-b border-slate-100 px-5 py-3 bg-white flex items-center justify-between">
            <input
              type="text"
              placeholder="Search teacher by name, email, or phone..."
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
          <div className="overflow-x-auto">
            {filteredTeachers.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                <p className="font-bold text-slate-600">No active teachers found for {period.label}.</p>
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 pl-5 pr-3">Teacher</th>
                    <th className="px-3 py-3">Designation</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Monthly Salary</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="py-3 pl-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      {/* Name */}
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-xs font-black text-white uppercase shadow-xs">
                            {t.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">{t.name}</span>
                            {t.email && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                                {t.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-3 py-3.5">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 capitalize">
                          Teaching Faculty
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-3.5 text-slate-600 font-medium">
                        {t.phone || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Monthly Salary with "Set Salary" Button in Row */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {pkr(t.monthly_salary)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openSetSalary(t)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-brand-navy transition cursor-pointer shadow-2xs"
                            title="Set or update monthly salary"
                          >
                            <svg className="h-3 w-3 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            Set Salary
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5">
                        {t.isPaid ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold text-amber-600">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Action: Pay Salary or Print Receipt */}
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        {t.isPaid ? (
                          <Link
                            href={`/finance/salaries/receipt/${t.paymentId || t.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-navy px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-accent shadow-xs active:scale-95 cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Print Receipt
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPaySalary(t)}
                            className="rounded-xl bg-brand-navy px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-accent cursor-pointer shadow-xs active:scale-95"
                          >
                            Pay Salary
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Teachers Directory View */}
      {activeTab === "directory" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition animate-fadeIn">
          <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-brand-navy">Teachers Directory</h2>
              <p className="text-xs text-slate-500">All faculty records and configured monthly salaries.</p>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="p-5">
            {!allTeachers.length ? (
              <p className="text-sm text-slate-500">No teachers found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 pr-2">Name</th>
                      <th className="py-2.5 pr-2">Email</th>
                      <th className="py-2.5 pr-2">Phone</th>
                      <th className="py-2.5 pr-2">Monthly Salary</th>
                      <th className="py-2.5 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 pr-2 font-bold text-brand-navy text-sm">{t.name}</td>
                        <td className="py-3 pr-2 font-medium text-slate-600">{t.email || "—"}</td>
                        <td className="py-3 pr-2 text-slate-600">{t.phone || "—"}</td>
                        <td className="py-3 pr-2 font-bold tabular-nums text-slate-900">{pkr(t.monthly_salary)}</td>
                        <td className="py-3 pr-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              t.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.is_active ? "Active" : "Suspended"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. BOTTOM SECTION: Collapsible Salary Payment History */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition">
        <div
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsHistoryOpen((prev) => !prev);
            }
          }}
          className="flex cursor-pointer items-center justify-between bg-slate-50/80 px-5 py-4 transition hover:bg-slate-100/70 select-none"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-brand-navy">Salary Payment History</h3>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {paymentLog.length} records
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Teacher payment logs and print vouchers for <b className="text-slate-800">{period.label}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
              {isHistoryOpen ? "Hide History ▴" : "Show History ▾"}
            </span>
          </div>
        </div>

        {isHistoryOpen && (
          <div className="p-5 border-t border-slate-100 animate-fadeIn">
            {!paymentLog.length ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No salary payments recorded yet for {period.label}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-2.5 pr-2">Teacher Name</th>
                      <th className="py-2.5 pr-2">Email</th>
                      <th className="py-2.5 pr-2">Salary Month</th>
                      <th className="py-2.5 pr-2">Amount Paid</th>
                      <th className="py-2.5 pr-2">Payment Method</th>
                      <th className="py-2.5 pr-2">Receipt No</th>
                      <th className="py-2.5 pr-2">Date &amp; Time</th>
                      <th className="py-2.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentLog.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 pr-2 font-bold text-brand-navy">{log.name}</td>
                        <td className="py-2.5 pr-2 text-slate-600">{log.email || "—"}</td>
                        <td className="py-2.5 pr-2">{log.monthLabel}</td>
                        <td className="py-2.5 pr-2 tabular-nums font-black text-emerald-800">
                          {pkr(log.amount)}
                        </td>
                        <td className="py-2.5 pr-2 capitalize text-slate-600">{log.method || "Cash"}</td>
                        <td className="py-2.5 pr-2 font-mono text-xs text-slate-500">{log.receipt}</td>
                        <td className="py-2.5 pr-2 text-slate-500">
                          {new Date(log.paid_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">
                          <Link
                            href={`/finance/salaries/receipt/${log.id}`}
                            target="_blank"
                            className="rounded-lg bg-brand-navy px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-accent transition shadow-2xs"
                          >
                            Print Receipt
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
      </section>

      {/* Set Salary Dialog Modal */}
      {settingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition">
            <h3 className="text-base font-black text-brand-navy">Set Teacher Salary</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update monthly compensation for <b className="text-slate-800">{settingTeacher.name}</b>.
            </p>

            {settingFeedback?.error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                {settingFeedback.error}
              </div>
            )}
            {settingFeedback?.ok && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800">
                ✓ Salary successfully updated!
              </div>
            )}

            <form onSubmit={handleSaveSalary} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Salary (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(Math.max(0, Number(e.target.value)))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-brand-navy outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30 tabular-nums"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettingTeacher(null)}
                  disabled={settingPending}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingPending}
                  className="rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-accent transition cursor-pointer shadow-xs"
                >
                  {settingPending ? "Saving..." : "Save Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Dialog Modal */}
      {payingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition">
            <h3 className="text-base font-black text-brand-navy">Disburse Salary</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm salary payment for <b className="text-slate-800">{payingTeacher.name}</b> for <b className="text-brand-navy">{period.label}</b>.
            </p>

            {payingFeedback?.error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                {payingFeedback.error}
              </div>
            )}
            {payingFeedback?.ok && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800">
                ✓ Salary disbursed successfully! Receipt generated.
              </div>
            )}

            <form onSubmit={handleConfirmPay} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount to Pay (PKR)
                </label>
                <input
                  type="number"
                  min={1}
                  value={payingAmount}
                  onChange={(e) => setPayingAmount(Math.max(1, Number(e.target.value)))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-emerald-900 outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={payingMethod}
                  onChange={(e) => setPayingMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-brand-sky"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingTeacher(null)}
                  disabled={payingPending}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payingPending}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                >
                  {payingPending ? "Processing..." : `Confirm & Pay ${pkr(payingAmount)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

