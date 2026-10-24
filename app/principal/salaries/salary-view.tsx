"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { paySalary, payOtherEmployeeSalary, setStaffSalary } from "@/lib/actions";
import { MONTHS, pkr } from "@/lib/format";

export interface StaffSalaryItem {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  phone: string | null;
  joined_on: string | null;
  monthly_salary: number;
  isPaid: boolean;
  paymentId?: string | null;
  receipt?: string | null;
  paidAmount?: number | null;
  paidAt?: string | null;
  method?: string | null;
}

export function PrincipalSalaryView({
  activeTab: rawActiveTab,
  initialStatus = null,
  period,
  teachers,
  financeStaff = [],
  otherEmployees,
  basePath = "/principal/salaries",
  hideFinanceTab = false,
}: {
  activeTab: "teachers" | "finance" | "employees";
  initialStatus?: "all" | "pending" | "paid" | null;
  period: { month: number; year: number; label: string; isFuture: boolean };
  teachers: StaffSalaryItem[];
  financeStaff?: StaffSalaryItem[];
  otherEmployees: StaffSalaryItem[];
  basePath?: string;
  hideFinanceTab?: boolean;
}) {
  const activeTab = hideFinanceTab && rawActiveTab === "finance" ? "teachers" : rawActiveTab;
  const router = useRouter();

  // Filter status state (All, Pending, Paid, or null if closed)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | null>(initialStatus ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickTab, setActiveQuickTab] = useState<"teachers" | "finance" | "employees" | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStatusFilter(initialStatus ?? null);
    setSearchQuery("");
  }, [activeTab, initialStatus]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tabsContainerRef.current && !tabsContainerRef.current.contains(e.target as Node)) {
        setActiveQuickTab(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Category counts
  const categoryStats = {
    teachers: {
      total: teachers.length,
      paid: teachers.filter((t) => t.isPaid).length,
      pending: teachers.filter((t) => !t.isPaid).length,
    },
    finance: {
      total: financeStaff.length,
      paid: financeStaff.filter((s) => s.isPaid).length,
      pending: financeStaff.filter((s) => !s.isPaid).length,
    },
    employees: {
      total: otherEmployees.length,
      paid: otherEmployees.filter((e) => e.isPaid).length,
      pending: otherEmployees.filter((e) => !e.isPaid).length,
    },
  };

  // Active paying modal/inline state
  const [payingPerson, setPayingPerson] = useState<StaffSalaryItem | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>("cash");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok?: boolean; message?: string; receipt?: string; paymentId?: string } | null>(null);

  // Set salary modal state
  const [settingPerson, setSettingPerson] = useState<StaffSalaryItem | null>(null);
  const [newSalaryInput, setNewSalaryInput] = useState<number>(0);
  const [settingPending, setSettingPending] = useState(false);
  const [settingFeedback, setSettingFeedback] = useState<{ ok?: boolean; message?: string } | null>(null);

  // Active list based on active tab
  const currentList =
    activeTab === "teachers" ? teachers : activeTab === "finance" ? financeStaff : otherEmployees;

  const currentCategoryStats = categoryStats[activeTab];

  // Filtered displayed list based on statusFilter and optional searchQuery
  const displayedList = currentList.filter((person) => {
    if (statusFilter === "paid" && !person.isPaid) return false;
    if (statusFilter === "pending" && person.isPaid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = person.name.toLowerCase().includes(q);
      const matchEmail = (person.email || "").toLowerCase().includes(q);
      const matchPhone = (person.phone || "").includes(q);
      const matchRole = person.role.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
    }
    return true;
  });

  const totalCount = currentList.length;
  const paidList = currentList.filter((s) => s.isPaid);
  const unpaidList = currentList.filter((s) => !s.isPaid);

  const totalBudget = currentList.reduce((acc, s) => acc + s.monthly_salary, 0);
  const totalPaidAmount = paidList.reduce(
    (acc, s) => acc + (s.paidAmount != null ? s.paidAmount : s.monthly_salary),
    0
  );
  const pendingAmount = unpaidList.reduce((acc, s) => acc + s.monthly_salary, 0);

  const openPayDialog = (person: StaffSalaryItem) => {
    setPayingPerson(person);
    setPayAmount(person.monthly_salary || 0);
    setPayMethod("cash");
    setFeedback(null);
  };

  const closePayDialog = () => {
    setPayingPerson(null);
    setFeedback(null);
  };

  const openSetSalaryDialog = (person: StaffSalaryItem) => {
    setSettingPerson(person);
    setNewSalaryInput(person.monthly_salary || 0);
    setSettingFeedback(null);
  };

  const closeSetSalaryDialog = () => {
    setSettingPerson(null);
    setSettingFeedback(null);
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingPerson) return;
    setSettingPending(true);
    setSettingFeedback(null);
    try {
      const res = await setStaffSalary(settingPerson.id, activeTab, newSalaryInput);
      if (res?.ok) {
        setSettingFeedback({
          ok: true,
          message: `Monthly salary successfully updated to ${pkr(newSalaryInput)}!`,
        });
        settingPerson.monthly_salary = newSalaryInput;
        setTimeout(() => {
          closeSetSalaryDialog();
          router.refresh();
        }, 1200);
      } else {
        setSettingFeedback({
          ok: false,
          message: res?.error || "Failed to update salary. Please try again.",
        });
      }
    } catch (err: unknown) {
      setSettingFeedback({
        ok: false,
        message: err instanceof Error ? err.message : "Error saving salary",
      });
    } finally {
      setSettingPending(false);
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPerson) return;
    setPending(true);
    setFeedback(null);

    const fd = new FormData();
    fd.set("month", String(period.month));
    fd.set("year", String(period.year));
    fd.set("amount", String(payAmount));
    fd.set("method", payMethod);

    try {
      let res;
      if (activeTab === "employees") {
        fd.set("employee_id", payingPerson.id);
        res = await payOtherEmployeeSalary(fd);
      } else {
        fd.set("teacher_id", payingPerson.id);
        res = await paySalary(fd);
      }

      if (res?.ok) {
        setFeedback({
          ok: true,
          message: `Payment successful! Receipt: ${res.receipt || "Confirmed"}`,
          receipt: res.receipt,
        });
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setFeedback({
          ok: false,
          message: res?.error || "Payment failed. Please try again.",
        });
      }
    } catch (err: unknown) {
      setFeedback({
        ok: false,
        message: err instanceof Error ? err.message : "Payment error occurred",
      });
    } finally {
      setPending(false);
    }
  };

  const tabTitles = {
    teachers: {
      title: "Teachers Salary",
    },
    finance: {
      title: "Finance Staff Salary",
    },
    employees: {
      title: "Other Employees Salary",
    },
  };

  return (
    <div className="space-y-5">
      {/* Category Tabs with Quick Links Popovers */}
      <div ref={tabsContainerRef} className="relative flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "teachers", label: "👨‍🏫 Teachers", count: teachers.length, stats: categoryStats.teachers },
          ...(!hideFinanceTab ? [{ key: "finance", label: "💼 Finance Staff", count: financeStaff.length, stats: categoryStats.finance }] : []),
          { key: "employees", label: "🔧 Other Employees", count: otherEmployees.length, stats: categoryStats.employees },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const isQuickOpen = activeQuickTab === tab.key;

          return (
            <div key={tab.key} className="relative">
              <div
                className={`inline-flex items-center rounded-xl p-0.5 transition shadow-xs ${
                  isActive
                    ? "bg-[#0b1f3a] text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80"
                }`}
              >
                <Link
                  href={`${basePath}?type=${tab.key}&month=${period.month}&year=${period.year}`}
                  onClick={() => {
                    if (isActive) {
                      setActiveQuickTab(isQuickOpen ? null : (tab.key as "teachers" | "finance" | "employees"));
                    }
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold"
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveQuickTab(isQuickOpen ? null : (tab.key as "teachers" | "finance" | "employees"));
                  }}
                  className={`rounded-lg px-2 py-2 text-[11px] font-bold transition cursor-pointer ${
                    isActive
                      ? "hover:bg-white/10 text-white/80 hover:text-white"
                      : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                  }`}
                  title={`${tab.label} Quick Links (Pending / Paid)`}
                >
                  ▾
                </button>
              </div>

              {/* Quick Links Popover */}
              {isQuickOpen && (
                <div
                  className="absolute left-0 top-full mt-2 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl ring-1 ring-black/5 animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {tab.label} Actions
                    </span>
                    <button
                      onClick={() => setActiveQuickTab(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs leading-none"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href={`${basePath}?type=${tab.key}&status=pending&month=${period.month}&year=${period.year}`}
                      onClick={() => {
                        if (isActive) setStatusFilter("pending");
                        setActiveQuickTab(null);
                      }}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                        isActive && statusFilter === "pending"
                          ? "bg-amber-500 text-white"
                          : "text-amber-800 bg-amber-50/60 hover:bg-amber-100/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>⏳</span>
                        <span>Pending</span>
                      </span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-amber-900">
                        {tab.stats.pending}
                      </span>
                    </Link>

                    <Link
                      href={`${basePath}?type=${tab.key}&status=paid&month=${period.month}&year=${period.year}`}
                      onClick={() => {
                        if (isActive) setStatusFilter("paid");
                        setActiveQuickTab(null);
                      }}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                        isActive && statusFilter === "paid"
                          ? "bg-emerald-600 text-white"
                          : "text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>✅</span>
                        <span>Paid</span>
                      </span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-emerald-900">
                        {tab.stats.paid}
                      </span>
                    </Link>

                    <Link
                      href={`${basePath}?type=${tab.key}&status=all&month=${period.month}&year=${period.year}`}
                      onClick={() => {
                        if (isActive) setStatusFilter("all");
                        setActiveQuickTab(null);
                      }}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                        isActive && statusFilter === "all"
                          ? "bg-slate-800 text-white"
                          : "text-slate-700 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>📋</span>
                        <span>View All</span>
                      </span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-slate-800">
                        {tab.stats.total}
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Tab Heading & Compact Period Search Form */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-brand-navy">{tabTitles[activeTab].title}</h2>

        <form method="get" className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
          <input type="hidden" name="type" value={activeTab} />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <div className="flex items-center gap-1.5 text-xs">
            <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="font-bold text-slate-500">Month:</span>
            <select
              name="month"
              defaultValue={period.month}
              className="bg-transparent font-bold text-brand-navy outline-none cursor-pointer"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-300">·</span>

          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-slate-500">Year:</span>
            <input
              name="year"
              type="number"
              min={2020}
              max={2035}
              defaultValue={period.year}
              className="w-14 bg-transparent font-bold text-brand-navy outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-brand-navy px-3 py-1 text-xs font-bold text-white transition hover:bg-brand-accent cursor-pointer shadow-2xs"
          >
            Show
          </button>
        </form>
      </div>

      {/* Summary KPI Quick Links (All, Paid & Unpaid - Click to Open / Toggle) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {/* All Salaries Card */}
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "all" ? null : "all"))}
          className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
            statusFilter === "all"
              ? "border-[#0b1f3a] bg-slate-100/90 ring-2 ring-[#0b1f3a]/25 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
          }`}
          title={statusFilter === "all" ? "Click to close" : "Click to view All Salaries"}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">All Salaries</p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                statusFilter === "all" ? "bg-[#0b1f3a] text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-brand-navy tabular-nums">{totalCount}</span>
            <span className="text-base sm:text-lg font-black text-slate-700 tabular-nums">{pkr(totalBudget)}</span>
          </div>
        </button>

        {/* Paid Salaries Card */}
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "paid" ? null : "paid"))}
          className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
            statusFilter === "paid"
              ? "border-emerald-600 bg-emerald-100/70 ring-2 ring-emerald-500/25 shadow-sm"
              : "border-emerald-200/80 bg-emerald-50/50 hover:border-emerald-300 shadow-xs"
          }`}
          title={statusFilter === "paid" ? "Click to close" : "Click to view Paid Salaries"}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Paid Salaries</p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                statusFilter === "paid" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900 tabular-nums">{paidList.length}</span>
            <span className="text-base sm:text-lg font-black text-emerald-800 tabular-nums">{pkr(totalPaidAmount)}</span>
          </div>
        </button>

        {/* Unpaid / Pending Card */}
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "pending" ? null : "pending"))}
          className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
            statusFilter === "pending"
              ? "border-amber-600 bg-amber-100/70 ring-2 ring-amber-500/25 shadow-sm"
              : "border-amber-200/80 bg-amber-50/50 hover:border-amber-300 shadow-xs"
          }`}
          title={statusFilter === "pending" ? "Click to close" : "Click to view Unpaid / Pending"}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Unpaid / Pending</p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                statusFilter === "pending" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-900 tabular-nums">{unpaidList.length}</span>
            <span className="text-base sm:text-lg font-black text-amber-800 tabular-nums">{pkr(pendingAmount)}</span>
          </div>
        </button>
      </div>

      {/* Directory Table (Opens on click of any quick link above) */}
      {statusFilter !== null && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs animate-fadeIn">
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search staff…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              title="Close list"
            >
              <span>Close</span>
              <span>✕</span>
            </button>
          </div>

        {displayedList.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            <p className="text-sm font-bold text-slate-600">No record found</p>
            <p className="mt-1 text-slate-400">
              {searchQuery.trim()
                ? `No staff matching "${searchQuery.trim()}" for ${period.label}.`
                : statusFilter
                  ? `No ${statusFilter} records found for ${period.label}.`
                  : `No staff salary records found for ${period.label}.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 pl-5 pr-3">Staff Member</th>
                  <th className="px-3 py-3">Role / Title</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Monthly Salary</th>
                  <th className="px-3 py-3">Payment Status</th>
                  <th className="py-3 pl-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedList.map((person) => {
                  return (
                    <tr key={person.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1f3a] text-xs font-black text-white uppercase">
                            {person.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{person.name}</span>
                            {person.email && (
                              <span className="text-[11px] text-slate-500 font-normal block truncate max-w-[200px]">
                                {person.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 capitalize">
                          {person.role}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-slate-600">
                        {person.phone ? (
                          <a href={`tel:${person.phone}`} className="hover:text-brand-navy hover:underline">
                            {person.phone}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {pkr(person.monthly_salary)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openSetSalaryDialog(person)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-brand-navy transition cursor-pointer shadow-2xs"
                            title="Set or change monthly salary"
                          >
                            <svg className="h-3 w-3 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            Set Salary
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        {person.isPaid ? (
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

                      <td className="py-3.5 pl-3 pr-5 text-right">
                        {person.isPaid ? (
                          <div className="flex items-center justify-end">
                            <Link
                              href={`${basePath}/receipt/${person.paymentId || person.id}?type=${activeTab}&month=${period.month}&year=${period.year}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b1f3a] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-accent shadow-xs active:scale-95 cursor-pointer"
                              title="Print official payment receipt voucher"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                              </svg>
                              Print Receipt
                            </Link>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPayDialog(person)}
                            className="rounded-xl bg-[#0b1f3a] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-accent cursor-pointer shadow-xs active:scale-95"
                          >
                            Pay Salary
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Payment Confirmation Modal / Dialog */}
      {payingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-navy">
                  Disburse Salary
                </span>
                <h3 className="mt-1 text-lg font-black text-brand-navy">{payingPerson.name}</h3>
                <p className="text-xs text-slate-500 capitalize">
                  {payingPerson.role} · For {period.label}
                </p>
              </div>
              <button
                onClick={closePayDialog}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-4 rounded-xl p-3 text-xs font-bold ${
                  feedback.ok
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{feedback.message}</span>
                  {feedback.ok && (
                    <Link
                      href={`${basePath}/receipt/${payingPerson.id}?type=${activeTab}&month=${period.month}&year=${period.year}`}
                      target="_blank"
                      className="rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-900 transition shrink-0"
                    >
                      Print Receipt ↗
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleExecutePayment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600">
                  Disbursement Amount (PKR)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-brand-navy focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-navy focus:bg-white cursor-pointer"
                >
                  <option value="cash">Cash in hand</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online / EasyPaisa / JazzCash</option>
                </select>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
                Receipt voucher will be automatically generated and linked to the school financial ledger.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePayDialog}
                  disabled={pending}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-[#0b1f3a] px-5 py-2 text-xs font-bold text-white hover:bg-brand-accent disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {pending ? "Processing…" : `Confirm & Pay ${pkr(payAmount)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Set / Change Salary Modal */}
      {settingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-800 border border-sky-100">
                  Set Monthly Salary
                </span>
                <h3 className="mt-1 text-lg font-black text-brand-navy">{settingPerson.name}</h3>
                <p className="text-xs text-slate-500 capitalize">
                  {settingPerson.role} · Changeable Salary Configuration
                </p>
              </div>
              <button
                type="button"
                onClick={closeSetSalaryDialog}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {settingFeedback && (
              <div
                className={`mt-4 rounded-xl p-3 text-xs font-bold ${
                  settingFeedback.ok
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {settingFeedback.message}
              </div>
            )}

            <form onSubmit={handleSaveSalary} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Monthly Salary Amount (PKR)
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-xs font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={newSalaryInput}
                    onChange={(e) => setNewSalaryInput(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-base font-black text-slate-900 outline-none focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-sky/30"
                    placeholder="Enter monthly salary"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Current recorded salary: <span className="font-bold text-slate-700">{pkr(settingPerson.monthly_salary)}</span> / month
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Salary Policy Notice:</p>
                <p>
                  Updating this salary will adjust future disbursements and financial ledger projections for this staff member. You can change this amount at any time.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeSetSalaryDialog}
                  disabled={settingPending}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingPending}
                  className="rounded-xl bg-[#0b1f3a] px-5 py-2 text-xs font-bold text-white hover:bg-brand-accent disabled:opacity-60 cursor-pointer shadow-xs active:scale-95 transition"
                >
                  {settingPending ? "Saving…" : "Save New Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

