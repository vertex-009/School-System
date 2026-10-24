"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStaffSalary, payOtherEmployeeSalary, setOtherEmployeeActive } from "@/lib/actions";
import { MONTHS, pkr } from "@/lib/format";
import { formatCnic } from "@/lib/cnic";
import { OtherEmployeeForm } from "./form";

export type OtherEmployeeItem = {
  id: string;
  name: string;
  email?: string | null;
  job_title: string;
  phone: string | null;
  cnic?: string | null;
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

export type PaymentLogItem = {
  id: string;
  employee_id: string;
  name: string;
  role: string;
  amount: number;
  method: string | null;
  receipt: string;
  paid_at: string;
  monthLabel: string;
};

export function OtherEmployeesHubClient({
  period,
  employees,
  paymentLog,
  allEmployees,
}: {
  period: { month: number; year: number; label: string };
  employees: OtherEmployeeItem[];
  paymentLog: PaymentLogItem[];
  allEmployees: OtherEmployeeItem[];
}) {
  const router = useRouter();

  // 3 Quick Links: "add" | "pay" | "directory". Default open: "pay"
  const [activeTab, setActiveTab] = useState<"add" | "pay" | "directory" | null>("pay");
  // Collapsible History at the bottom: hidden by default or toggleable
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Set Salary Modal state
  const [settingEmp, setSettingEmp] = useState<OtherEmployeeItem | null>(null);
  const [salaryInput, setSalaryInput] = useState<number>(0);
  const [settingPending, setSettingPending] = useState(false);
  const [settingFeedback, setSettingFeedback] = useState<{ ok?: boolean; error?: string } | null>(null);

  // Pay Salary Modal state
  const [payingEmp, setPayingEmp] = useState<OtherEmployeeItem | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [payingMethod, setPayingMethod] = useState<string>("cash");
  const [payingPending, setPayingPending] = useState(false);
  const [payingFeedback, setPayingFeedback] = useState<{ ok?: boolean; error?: string } | null>(null);

  // Handlers for Set Salary
  const openSetSalary = (emp: OtherEmployeeItem) => {
    setSettingEmp(emp);
    setSalaryInput(emp.monthly_salary);
    setSettingFeedback(null);
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingEmp) return;
    setSettingPending(true);
    setSettingFeedback(null);
    try {
      const res = await setStaffSalary(settingEmp.id, "employees", salaryInput);
      if (res?.ok) {
        setSettingFeedback({ ok: true });
        settingEmp.monthly_salary = salaryInput;
        setTimeout(() => {
          setSettingEmp(null);
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
  const openPaySalary = (emp: OtherEmployeeItem) => {
    setPayingEmp(emp);
    setPayingAmount(emp.monthly_salary);
    setPayingMethod("cash");
    setPayingFeedback(null);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingEmp) return;
    setPayingPending(true);
    setPayingFeedback(null);
    const fd = new FormData();
    fd.set("employee_id", payingEmp.id);
    fd.set("amount", String(payingAmount));
    fd.set("method", payingMethod);
    fd.set("month", String(period.month));
    fd.set("year", String(period.year));

    try {
      const res = await payOtherEmployeeSalary(fd);
      if (res?.error) {
        setPayingFeedback({ error: res.error });
      } else {
        setPayingFeedback({ ok: true });
        setTimeout(() => {
          setPayingEmp(null);
          router.refresh();
        }, 1000);
      }
    } catch (err: unknown) {
      setPayingFeedback({ error: err instanceof Error ? err.message : "Error paying salary" });
    } finally {
      setPayingPending(false);
    }
  };

  // Filter employees for pay tab
  const filteredEmployees = employees.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.job_title.toLowerCase().includes(q) || (e.phone && e.phone.includes(q));
  });

  const paidCount = employees.filter((e) => e.isPaid).length;
  const unpaidCount = employees.filter((e) => !e.isPaid).length;
  const totalBilled = employees.reduce((sum, e) => sum + e.monthly_salary, 0);
  const totalPaid = employees.filter((e) => e.isPaid).reduce((sum, e) => sum + (e.paidAmount || e.monthly_salary), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy">Other Employees</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage support staff, update monthly salaries, disburse salaries, and inspect payment records.
          </p>
        </div>
      </div>

      {/* 3 Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* 1. Add Other Employee */}
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
              <h3 className="text-base font-black text-slate-800">Add Other Employee</h3>
              <p className="text-xs text-slate-500 mt-0.5">Register driver, peon, guard, maid</p>
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

        {/* 3. Employee Directory */}
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
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800">Employee Directory</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                  {allEmployees.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">View and manage all employee records</p>
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

      {/* Tab 1: Add Other Employee Form */}
      {activeTab === "add" && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition animate-fadeIn">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-brand-navy">Add New Support Employee</h2>
              <p className="text-xs text-slate-500">Enter personal details and set initial monthly salary.</p>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <OtherEmployeeForm />
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
                  Salary Disbursement · {period.label}
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
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Staff</span>
                <p className="text-lg font-black text-brand-navy mt-0.5">{employees.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Paid Staff</span>
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
              placeholder="Search staff by name, title, or phone..."
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
            {filteredEmployees.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                <p className="font-bold text-slate-600">No active other employees found for {period.label}.</p>
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 pl-5 pr-3">Employee</th>
                    <th className="px-3 py-3">Job Title</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Monthly Salary</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="py-3 pl-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                      {/* Name */}
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-xs font-black text-white uppercase shadow-xs">
                            {emp.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">{emp.name}</span>
                            {emp.cnic && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                CNIC: {formatCnic(emp.cnic)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="px-3 py-3.5">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 capitalize">
                          {emp.job_title}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-3.5 text-slate-600 font-medium">
                        {emp.phone || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Monthly Salary with "Set Salary" Button in Row */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {pkr(emp.monthly_salary)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openSetSalary(emp)}
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
                        {emp.isPaid ? (
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
                        {emp.isPaid ? (
                          <Link
                            href={`/finance/employees/receipt/${emp.paymentId || emp.id}`}
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
                            onClick={() => openPaySalary(emp)}
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

      {/* Tab 3: Employee Directory View */}
      {activeTab === "directory" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition animate-fadeIn">
          <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-brand-navy">Employee Directory</h2>
              <p className="text-xs text-slate-500">All registered support staff records &amp; employment status.</p>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="p-5">
            {!allEmployees.length ? (
              <p className="text-sm text-slate-500">No employees registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 pr-2">Name</th>
                      <th className="py-2.5 pr-2">Role</th>
                      <th className="py-2.5 pr-2">CNIC</th>
                      <th className="py-2.5 pr-2">Phone</th>
                      <th className="py-2.5 pr-2">Salary</th>
                      <th className="py-2.5 pr-2">Status</th>
                      <th className="py-2.5 text-right">Toggle Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allEmployees.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 pr-2 font-bold text-brand-navy text-sm">{e.name}</td>
                        <td className="py-3 pr-2 capitalize font-medium text-slate-700">{e.job_title}</td>
                        <td className="py-3 pr-2 font-mono text-slate-600">{e.cnic ? formatCnic(e.cnic) : "—"}</td>
                        <td className="py-3 pr-2 text-slate-600">{e.phone || "—"}</td>
                        <td className="py-3 pr-2 font-bold tabular-nums text-slate-900">{pkr(e.monthly_salary)}</td>
                        <td className="py-3 pr-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              e.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {e.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <form
                            action={async () => {
                              await setOtherEmployeeActive(e.id, !e.is_active);
                              router.refresh();
                            }}
                          >
                            <button
                              type="submit"
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                                e.is_active
                                  ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              }`}
                            >
                              {e.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </form>
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
                Payment logs and print vouchers for <b className="text-slate-800">{period.label}</b>
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
                      <th className="py-2.5 pr-2">Employee Name</th>
                      <th className="py-2.5 pr-2">Job Title</th>
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
                        <td className="py-2.5 pr-2 capitalize text-slate-700">{log.role}</td>
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
                            href={`/finance/employees/receipt/${log.id}`}
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
      {settingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition">
            <h3 className="text-base font-black text-brand-navy">Set Monthly Salary</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update monthly compensation for <b className="text-slate-800">{settingEmp.name}</b> ({settingEmp.job_title}).
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
                  onClick={() => setSettingEmp(null)}
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
      {payingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition">
            <h3 className="text-base font-black text-brand-navy">Disburse Salary</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm salary payment for <b className="text-slate-800">{payingEmp.name}</b> for <b className="text-brand-navy">{period.label}</b>.
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
                  onClick={() => setPayingEmp(null)}
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

