import Link from "next/link";
import { setStaffActive } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back } from "@/components/ui";
import { MONTHS, pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const [{ data: staff }, { data: salaries }, { data: payments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, phone, is_active, cnic, photo_url, joined_on, left_on, created_at")
      .eq("school_id", schoolId)
      .eq("role", "finance")
      .order("name"),
    supabase.from("teacher_salaries").select("teacher_id, monthly_salary").eq("school_id", schoolId),
    period.isFuture
      ? Promise.resolve({ data: [] as { teacher_id: string; amount: number }[] })
      : supabase
          .from("salary_payments")
          .select("teacher_id, amount")
          .eq("school_id", schoolId)
          .eq("month", period.month)
          .eq("year", period.year),
  ]);

  const all = staff || [];
  const salaryMap = Object.fromEntries((salaries || []).map((s) => [s.teacher_id, Number(s.monthly_salary)]));
  const paidMap = Object.fromEntries((payments || []).map((p) => [p.teacher_id, Number(p.amount)]));

  const inPeriod = all.filter((s) => inEmploymentWindow(s.joined_on || s.created_at, s.left_on, period));
  const rows = period.isFuture ? [] : inPeriod;
  const activeCount = rows.filter((s) => s.is_active).length;

  return (
    <Shell role="principal" title="Finance staff">
      <div className="space-y-4">
        {/* Top Navigation Row: Only Back link, no Add Finance button */}
        <div className="flex items-center">
          <Back href="/principal/finance" label="← Back to Finance Overview" />
        </div>

        {/* Counter Card & Search salary by month row */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-stretch">
          {/* Left Counter Card */}
          <div className="rounded-2xl border border-slate-800/40 bg-gradient-to-br from-[#0b1f3a] via-[#0d2744] to-[#1a5276] p-5 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                  Finance Accounts
                </p>
                <p className="mt-1 text-3xl font-black text-white">
                  {all.length.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sky-300">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-xs text-sky-200/70">
              Total registered finance accounts
            </p>
          </div>

          {/* Right Search salary by month filter card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0b1f3a]">Search salary by month</h3>
              <p className="text-xs text-slate-400 mt-0.5">Filter records and monthly payment statuses</p>
            </div>
            <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-xs font-bold text-slate-600">
                Month
                <select
                  name="month"
                  defaultValue={String(period.month)}
                  className="mt-1 block rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-brand-navy focus:bg-white focus:outline-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Year
                <input
                  name="year"
                  type="number"
                  min={2000}
                  max={2100}
                  defaultValue={period.year}
                  className="mt-1 block w-28 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-brand-navy focus:bg-white focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-brand-navy px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-brand-accent"
              >
                Show
              </button>
            </form>
          </div>
        </div>

        {/* Staff Table Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0b1f3a]">
                Finance staff · {period.label}
              </h2>
              <p className="text-xs text-slate-500">{rows.length} account(s)</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {activeCount.toString().padStart(2, "0")} Active Account{activeCount !== 1 ? "s" : ""}
            </span>
          </div>

          {!rows.length ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">
              {period.isFuture
                ? `Cannot view records for a future period (${period.label}).`
                : `No finance staff found for ${period.label}.`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                    <th className="py-3 pr-4">Staff Name</th>
                    <th className="py-3 pr-4">Phone</th>
                    <th className="py-3 pr-4">Monthly salary</th>
                    <th className="py-3 pr-4">{period.label} Payment</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((s) => {
                    const monthly = salaryMap[s.id] || 0;
                    const paid = paidMap[s.id];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Staff Name with Avatar & Subtitle */}
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                              {s.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.photo_url}
                                  alt={s.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-[#0b1f3a]">
                                  {s.name
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((p: string) => p[0]?.toUpperCase() || "")
                                    .join("") || "?"}
                                </span>
                              )}
                              {s.is_active && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#0b1f3a] leading-tight">{s.name}</p>
                              {s.email ? (
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                  {s.email}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 mt-0.5">Finance &amp; Accounts</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 pr-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>{s.phone || "—"}</span>
                          </div>
                        </td>

                        {/* Monthly Salary */}
                        <td className="py-3.5 pr-4 text-sm font-bold text-[#0b1f3a] tabular-nums">
                          {monthly ? pkr(monthly) : "—"}
                        </td>

                        {/* Period Payment Status Pill */}
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${
                              paid != null
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                paid != null ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {paid != null ? `Paid · ${pkr(paid)}` : "Unpaid"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                              s.is_active
                                ? "bg-sky-100 text-sky-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {s.is_active ? "Active" : "Suspended"}
                          </span>
                        </td>

                        {/* Action View Profile & Quick Suspend / Activate */}
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <form action={setStaffActive.bind(null, s.id, !s.is_active)}>
                              <button
                                type="submit"
                                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold border shadow-xs transition ${
                                  s.is_active
                                    ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                                }`}
                                title={s.is_active ? "Suspend staff" : "Activate staff"}
                              >
                                {s.is_active ? "Suspend" : "Activate"}
                              </button>
                            </form>
                            <Link
                              href={`/principal/staff/${s.id}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-50"
                            >
                              Profile →
                            </Link>
                          </div>
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
