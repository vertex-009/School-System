import Link from "next/link";
import { Shell } from "@/components/shell";
import { Back } from "@/components/ui";
import { formatCnic } from "@/lib/cnic";
import { MONTHS, pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { setOtherEmployeeActive } from "@/lib/actions";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PrincipalOtherEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const statusFilter = sp.status === "paid" ? "paid" : sp.status === "unpaid" ? "unpaid" : "all";

  const { supabase, schoolId, profile, readOnly } = await getContext();
  if (profile.role !== "principal" || !schoolId) redirect("/");

  const [{ data: employees, error }, { data: payments }] = await Promise.all([
    supabase
      .from("other_employees")
      .select("id, name, email, job_title, phone, cnic, monthly_salary, is_active, joined_on, left_on, created_at")
      .eq("school_id", schoolId)
      .order("name"),
    period.isFuture
      ? Promise.resolve({ data: [] as { employee_id: string; amount: number; receipt_no: string; method: string }[] })
      : supabase
          .from("other_salary_payments")
          .select("employee_id, amount, receipt_no, paid_at, method")
          .eq("school_id", schoolId)
          .eq("month", period.month)
          .eq("year", period.year),
  ]);

  const all = error ? [] : employees || [];
  const paidMap = Object.fromEntries((payments || []).map((p) => [p.employee_id, p]));

  const inPeriod = all.filter((e) => inEmploymentWindow(e.joined_on || e.created_at, e.left_on, period));
  const paidRows = inPeriod.filter((e) => paidMap[e.id] != null);
  const unpaidRows = inPeriod.filter((e) => e.is_active && !paidMap[e.id]);

  const paidCount = paidRows.length;
  const unpaidCount = period.isFuture ? 0 : unpaidRows.length;
  const totalCount = inPeriod.length;

  // Filter rows based on selected status
  const displayRows = period.isFuture
    ? []
    : statusFilter === "paid"
      ? paidRows
      : statusFilter === "unpaid"
        ? unpaidRows
        : inPeriod;

  const activeCount = displayRows.filter((e) => e.is_active).length;

  const filterQs = (st: string) => `/principal/employees?month=${period.month}&year=${period.year}&status=${st}`;

  return (
    <Shell role="principal" title="Other employees">
      <div className="space-y-5">
        {/* Top Navigation Row: Back Link & Add Employee */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Back href="/principal/other-employees" label="← Back to Other Employees Overview" />
          <Link
            href="/principal/employees/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:brightness-105 active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Add Employee</span>
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Run <code className="font-mono text-xs">migration_other_employees.sql</code> in Supabase if missing.
          </div>
        )}

        {/* Compact Period Filter Bar */}
        <div className="w-fit rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
          <form method="get" className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="status" value={statusFilter} />
            <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span className="text-xs font-bold text-[#0b1f3a]">Salary Month:</span>
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

        {/* Interactive Filter Cards: Total, Paid, and Unpaid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: All Employees */}
          <Link
            href={filterQs("all")}
            className={`group relative flex flex-col justify-between rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md border ${
              statusFilter === "all"
                ? "bg-gradient-to-br from-[#0b1f3a] via-[#102d54] to-[#1a5276] text-white border-[#0b1f3a] ring-2 ring-[#0b1f3a]/30"
                : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                All Employees
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  statusFilter === "all" ? "bg-white/15 text-white" : "bg-slate-100 text-[#0b1f3a]"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black tabular-nums">{totalCount.toString().padStart(2, "0")}</p>
              <p className={`text-[11px] font-semibold mt-1 ${statusFilter === "all" ? "text-sky-200" : "text-slate-400"}`}>
                Total on payroll ({period.label})
              </p>
            </div>
            {statusFilter === "all" && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-sky-400" />
            )}
          </Link>

          {/* Card 2: Paid in Month (Clickable Filter) */}
          <Link
            href={filterQs("paid")}
            className={`group relative flex flex-col justify-between rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md border ${
              statusFilter === "paid"
                ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 ring-2 ring-emerald-500/40"
                : "bg-emerald-50/50 border-emerald-200/90 text-emerald-950 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  statusFilter === "paid" ? "text-emerald-100" : "text-emerald-800"
                }`}
              >
                Paid · {period.label}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  statusFilter === "paid" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <p
                className={`text-3xl font-black tabular-nums ${
                  statusFilter === "paid" ? "text-white" : "text-emerald-700"
                }`}
              >
                {paidCount.toString().padStart(2, "0")}
              </p>
              <p
                className={`text-[11px] font-semibold mt-1 ${
                  statusFilter === "paid" ? "text-emerald-100" : "text-emerald-600"
                }`}
              >
                Salary disbursed (Click to view)
              </p>
            </div>
            {statusFilter === "paid" && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-white" />
            )}
          </Link>

          {/* Card 3: Unpaid (Active) (Clickable Filter) */}
          <Link
            href={filterQs("unpaid")}
            className={`group relative flex flex-col justify-between rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md border ${
              statusFilter === "unpaid"
                ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white border-amber-600 ring-2 ring-amber-500/40"
                : "bg-amber-50/50 border-amber-200/90 text-amber-950 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  statusFilter === "unpaid" ? "text-amber-100" : "text-amber-900"
                }`}
              >
                Unpaid (Active)
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  statusFilter === "unpaid" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <p
                className={`text-3xl font-black tabular-nums ${
                  statusFilter === "unpaid" ? "text-white" : "text-amber-800"
                }`}
              >
                {unpaidCount.toString().padStart(2, "0")}
              </p>
              <p
                className={`text-[11px] font-semibold mt-1 ${
                  statusFilter === "unpaid" ? "text-amber-100" : "text-amber-700"
                }`}
              >
                Pending disbursement (Click to view)
              </p>
            </div>
            {statusFilter === "unpaid" && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-white" />
            )}
          </Link>
        </div>

        {/* Directory Table Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0b1f3a]">
                  Directory · {period.label}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    statusFilter === "paid"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : statusFilter === "unpaid"
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {statusFilter === "paid"
                    ? "Showing Paid Only"
                    : statusFilter === "unpaid"
                      ? "Showing Unpaid Only"
                      : "Showing All"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{displayRows.length} employee(s) listed</p>
            </div>

            <div className="flex items-center gap-2">
              {statusFilter !== "all" && (
                <Link
                  href={filterQs("all")}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset Filter
                </Link>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {activeCount.toString().padStart(2, "0")} Active
              </span>
            </div>
          </div>

          {!displayRows.length ? (
            <div className="py-16 text-center text-sm font-semibold text-slate-500">
              {period.isFuture
                ? `Cannot view records for a future period (${period.label}).`
                : statusFilter === "paid"
                  ? `No employees paid yet for ${period.label}.`
                  : statusFilter === "unpaid"
                    ? `Great! No unpaid employees for ${period.label}. All staff are paid.`
                    : `No other employees found for ${period.label}.`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                    <th className="py-3 pr-4">Employee Name</th>
                    <th className="py-3 pr-4">Job Title</th>
                    <th className="py-3 pr-4">Phone</th>
                    <th className="py-3 pr-4">Monthly Salary</th>
                    <th className="py-3 pr-4">{period.label} Payment</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayRows.map((e) => {
                    const pay = paidMap[e.id] as
                      | { amount: number; receipt_no: string; method: string }
                      | undefined;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Employee Name with Avatar & CNIC */}
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                              <span className="text-xs font-bold text-[#0b1f3a]">
                                {e.name
                                  .split(/\s+/)
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((p: string) => p[0]?.toUpperCase() || "")
                                  .join("") || "?"}
                              </span>
                              {e.is_active && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#0b1f3a] leading-tight">{e.name}</p>
                              {e.email && <p className="text-[11px] text-slate-500">{e.email}</p>}
                              <p className="text-xs text-slate-400 mt-0.5">
                                {e.cnic ? formatCnic(e.cnic) : e.job_title}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Job Title */}
                        <td className="py-3.5 pr-4 text-xs font-bold text-slate-700">
                          <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                            {e.job_title}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 pr-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>{e.phone || "—"}</span>
                          </div>
                        </td>

                        {/* Monthly Salary */}
                        <td className="py-3.5 pr-4 text-sm font-bold text-[#0b1f3a] tabular-nums">
                          {pkr(e.monthly_salary)}
                        </td>

                        {/* Period Payment Status Pill */}
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${
                              pay != null
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                pay != null ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {pay != null ? `Paid · ${pkr(pay.amount)}` : "Unpaid"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                              e.is_active
                                ? "bg-sky-100 text-sky-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {e.is_active ? "Active" : "Suspended"}
                          </span>
                        </td>

                        {/* Actions: Suspend / Activate */}
                        <td className="py-3.5 text-right">
                          {!readOnly && (
                            <form action={setOtherEmployeeActive.bind(null, e.id, !e.is_active)}>
                              <button
                                type="submit"
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold border shadow-xs transition ${
                                  e.is_active
                                    ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                                }`}
                                title={e.is_active ? "Suspend employee" : "Activate employee"}
                              >
                                {e.is_active ? "Suspend" : "Activate"}
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
