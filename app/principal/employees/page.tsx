import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { formatCnic } from "@/lib/cnic";
import { pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PrincipalOtherEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "principal" || !schoolId) redirect("/");

  const [{ data: employees, error }, { data: payments }] = await Promise.all([
    supabase
      .from("other_employees")
      .select("id, name, job_title, phone, cnic, monthly_salary, is_active, joined_on, left_on, created_at")
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

  // Past: only paid rows. Current: in employment window. Future: none.
  const rows = period.isFuture
    ? []
    : period.isPast
      ? inPeriod.filter((e) => paidMap[e.id])
      : inPeriod;

  const paidCount = rows.filter((e) => paidMap[e.id]).length;
  const unpaidCount = period.isCurrent ? rows.filter((e) => e.is_active && !paidMap[e.id]).length : 0;

  return (
    <Shell role="principal" title="Other employees">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white px-6 py-4 w-fit">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Other employees</p>
        <p className="mt-1 text-3xl font-black text-brand-navy">{all.length}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Run <code className="font-mono text-xs">migration_other_employees.sql</code> in Supabase if missing.
        </div>
      )}

      <PeriodFilter period={period} title="Salary month" submitLabel="Show" />

      {period.isFuture || !rows.length ? (
        <NoRecordFound />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card title={`Paid · ${period.label}`}>
              <p className="text-2xl font-black text-emerald-700">{paidCount}</p>
            </Card>
            {period.isCurrent && (
              <Card title="Unpaid (active)">
                <p className="text-2xl font-black text-amber-700">{unpaidCount}</p>
              </Card>
            )}
          </div>

          <Card title={`Directory · ${period.label}`} subtitle={`${rows.length} employee(s)`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500">
                    <th className="py-2 pr-2 font-semibold">Name</th>
                    <th className="py-2 pr-2 font-semibold">Job</th>
                    <th className="py-2 pr-2 font-semibold">Phone</th>
                    <th className="py-2 pr-2 font-semibold">Salary</th>
                    <th className="py-2 pr-2 font-semibold">Active</th>
                    <th className="py-2 font-semibold">{period.label}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((e) => {
                    const pay = paidMap[e.id] as
                      | { amount: number; receipt_no: string; method: string }
                      | undefined;
                    return (
                      <tr key={e.id}>
                        <td className="py-2.5 pr-2 font-bold text-brand-navy">
                          {e.name}
                          {e.cnic && (
                            <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
                              {formatCnic(e.cnic)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2">{e.job_title}</td>
                        <td className="py-2.5 pr-2 text-slate-600">{e.phone || "—"}</td>
                        <td className="py-2.5 pr-2 tabular-nums">{pkr(e.monthly_salary)}</td>
                        <td className="py-2.5 pr-2 text-xs font-bold">
                          {e.is_active ? (
                            <span className="text-emerald-700">Yes</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {pay ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              Paid · {pkr(pay.amount)}
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                              Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </Shell>
  );
}
