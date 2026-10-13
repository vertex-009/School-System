import Link from "next/link";
import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
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
      .select("id, name, phone, is_active, cnic, photo_url, joined_on, left_on, created_at")
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
  const rows = period.isFuture
    ? []
    : period.isPast
      ? inPeriod.filter((s) => paidMap[s.id] != null)
      : inPeriod;

  return (
    <Shell role="principal" title="Finance staff">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-5 py-3 w-fit">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Finance accounts</p>
        <p className="text-2xl font-black text-brand-navy">{all.length}</p>
      </div>

      <PeriodFilter period={period} title="Search salary by month" submitLabel="Show" />

      {period.isFuture || !rows.length ? (
        <NoRecordFound />
      ) : (
        <Card title={`Finance staff · ${period.label}`} subtitle={`${rows.length} account(s)`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Phone</th>
                  <th className="py-2 pr-3 font-semibold">Monthly salary</th>
                  <th className="py-2 pr-3 font-semibold">{period.label}</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => {
                  const monthly = salaryMap[s.id] || 0;
                  const paid = paidMap[s.id];
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pr-3 font-bold text-brand-navy">{s.name}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{s.phone || "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{monthly ? pkr(monthly) : "—"}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            paid != null ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {paid != null ? `Paid · ${pkr(paid)}` : "Unpaid"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-semibold">{s.is_active ? "Active" : "Suspended"}</td>
                      <td className="py-2.5 text-right">
                        <Link href={`/principal/staff/${s.id}`} className="text-xs font-bold text-brand-accent hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Shell>
  );
}
