import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { MONTHS, pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function OtherEmployeeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const [{ data: others }, { data: otherPays }] = await Promise.all([
    supabase
      .from("other_employees")
      .select("id, name, phone, job_title, monthly_salary, is_active, joined_on, left_on")
      .eq("school_id", schoolId)
      .order("name"),
    supabase
      .from("other_salary_payments")
      .select("id, employee_id, amount, receipt_no, paid_at, method, month, year")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year)
      .order("paid_at", { ascending: false }),
  ]);

  const otherById = Object.fromEntries((others || []).map((e) => [e.id, e]));
  const otherPaidMap = Object.fromEntries((otherPays || []).map((p) => [p.employee_id, p]));
  const otherInWindow = (others || []).filter((e) => inEmploymentWindow(e.joined_on, e.left_on, period));

  type Row = {
    id: string;
    name: string;
    sub: string;
    amount: number;
    paid?: { amount: number; receipt_no: string; method: string };
  };

  const rows: Row[] = (
    period.isPast
      ? otherInWindow.filter((e) => otherPaidMap[e.id])
      : period.isCurrent
        ? otherInWindow
        : []
  ).map((e) => ({
    id: e.id,
    name: e.name,
    sub: e.job_title + (e.phone ? ` · ${e.phone}` : ""),
    amount: Number(e.monthly_salary),
    paid: otherPaidMap[e.id] as Row["paid"],
  }));

  const paid = rows.filter((t) => t.paid);
  const pending = period.isCurrent ? rows.filter((t) => !t.paid) : [];

  const paymentLog = (otherPays || [])
    .map((p) => {
      const emp = otherById[p.employee_id];
      return {
        id: p.id,
        name: emp?.name || "Employee",
        role: emp?.job_title || "other",
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

      {period.isFuture || (!rows.length && !paymentLog.length) ? (
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
                      <th className="py-2 pr-2">Job</th>
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
                  <p className="text-sm text-slate-500">All in-window employees paid for {period.label}.</p>
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
