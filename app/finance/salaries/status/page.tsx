import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { MONTHS, pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SalaryHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const [{ data: staff }, { data: salaries }, { data: payments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, phone, is_active, role, joined_on, left_on")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "finance"])
      .order("name"),
    supabase.from("teacher_salaries").select("teacher_id, monthly_salary").eq("school_id", schoolId),
    supabase
      .from("salary_payments")
      .select("id, teacher_id, amount, receipt_no, paid_at, method, month, year")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year)
      .order("paid_at", { ascending: false }),
  ]);

  const salaryMap = Object.fromEntries((salaries || []).map((s) => [s.teacher_id, Number(s.monthly_salary)]));
  const nameById = Object.fromEntries((staff || []).map((t) => [t.id, t]));
  const paidMap = Object.fromEntries((payments || []).map((p) => [p.teacher_id, p]));
  const portalInWindow = (staff || []).filter((t) => inEmploymentWindow(t.joined_on, t.left_on, period));

  type Row = {
    id: string;
    name: string;
    sub: string;
    amount: number;
    paid?: { amount: number; receipt_no: string; method: string };
  };

  const portalRows: Row[] = (
    period.isPast
      ? portalInWindow.filter((t) => paidMap[t.id])
      : period.isCurrent
        ? portalInWindow
        : []
  ).map((t) => ({
    id: t.id,
    name: t.name,
    sub: `${t.role}${t.phone ? ` · ${t.phone}` : ""}`,
    amount: salaryMap[t.id] || 0,
    paid: paidMap[t.id] as Row["paid"],
  }));

  const paid = portalRows.filter((t) => t.paid);
  const pending = period.isCurrent ? portalRows.filter((t) => !t.paid) : [];

  const paymentLog = (payments || [])
    .map((p) => {
      const person = nameById[p.teacher_id];
      return {
        id: p.id,
        name: person?.name || "Staff",
        role: person?.role || "staff",
        amount: Number(p.amount),
        method: p.method,
        receipt: p.receipt_no,
        paid_at: p.paid_at as string,
        monthLabel: `${MONTHS[(p.month || 1) - 1]} ${p.year}`,
      };
    })
    .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

  return (
    <Shell role="finance" title="Salary history">
      <PeriodFilter period={period} title="Filter by month" submitLabel="Show" />

      {period.isFuture || (!portalRows.length && !paymentLog.length) ? (
        <NoRecordFound />
      ) : (
        <>
          <Card title={`Payments · ${period.label}`} subtitle={`${paymentLog.length} record(s)`}>
            {!paymentLog.length ? (
              <NoRecordFound />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-slate-500">
                      <th className="py-2 pr-2">Name</th>
                      <th className="py-2 pr-2">Role</th>
                      <th className="py-2 pr-2">Month</th>
                      <th className="py-2 pr-2">Amount</th>
                      <th className="py-2 pr-2">Method</th>
                      <th className="py-2 pr-2">Receipt</th>
                      <th className="py-2">Paid at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentLog.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 pr-2 font-bold">{r.name}</td>
                        <td className="py-2 pr-2 capitalize text-slate-600">{r.role}</td>
                        <td className="py-2 pr-2 whitespace-nowrap">{r.monthLabel}</td>
                        <td className="py-2 pr-2 font-bold text-emerald-700">{pkr(r.amount)}</td>
                        <td className="py-2 pr-2 capitalize">{r.method}</td>
                        <td className="py-2 pr-2 font-mono text-xs">{r.receipt}</td>
                        <td className="py-2 whitespace-nowrap text-slate-600">
                          {new Date(r.paid_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={`Paid · ${period.label}`} subtitle={`${paid.length} people`}>
              {!paid.length ? (
                <NoRecordFound />
              ) : (
                <ul className="divide-y text-sm">
                  {paid.map((t) => (
                    <li key={t.id} className="flex justify-between py-2">
                      <span>
                        <b>{t.name}</b>
                        <span className="block text-xs text-slate-500">
                          {t.sub}
                          {t.paid ? ` · ${t.paid.receipt_no} · ${t.paid.method}` : ""}
                        </span>
                      </span>
                      <b className="text-emerald-700">{pkr(t.paid?.amount || 0)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {period.isCurrent && (
              <Card title="Pending salaries" subtitle={`${pending.length} unpaid`}>
                {!pending.length ? (
                  <p className="text-sm text-slate-500">All in-window staff paid for {period.label}.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {pending.map((t) => (
                      <li key={t.id} className="flex justify-between py-2">
                        <span>
                          <b>{t.name}</b>
                          <span className="block text-xs text-slate-500">{t.sub}</span>
                        </span>
                        <b className="text-amber-700">{pkr(t.amount)}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
