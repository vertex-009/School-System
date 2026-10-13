import Link from "next/link";
import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { TeacherPickerBar } from "@/components/teacher-picker-bar";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; teacher_id?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const [{ data: teachers }, { data: salaries }, { data: payments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, phone, is_active, cnic, joined_on, left_on, created_at")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
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

  const all = teachers || [];
  const teacherId = sp.teacher_id && all.some((t) => t.id === sp.teacher_id) ? sp.teacher_id : "";
  const salaryMap = Object.fromEntries((salaries || []).map((s) => [s.teacher_id, Number(s.monthly_salary)]));
  const paidMap = Object.fromEntries((payments || []).map((p) => [p.teacher_id, Number(p.amount)]));

  const inPeriod = all.filter((t) => inEmploymentWindow(t.joined_on || t.created_at, t.left_on, period));
  let rows = period.isFuture
    ? []
    : period.isPast
      ? inPeriod.filter((t) => paidMap[t.id] != null)
      : inPeriod;

  if (teacherId) rows = rows.filter((t) => t.id === teacherId);

  // Picker shows teachers who exist by this month (or all for browsing names)
  const pickerList = period.isFuture ? [] : inPeriod;

  return (
    <Shell role="principal" title="View teachers">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-navy to-[#1a5276] px-6 py-4 text-white shadow-sm w-fit">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Total teachers</p>
        <p className="mt-1 text-3xl font-black tabular-nums">{all.length}</p>
      </div>

      <Card title="Find a teacher" subtitle="Search or tap a name · then filter salary by month">
        <TeacherPickerBar
          teachers={pickerList.map((t) => ({ id: t.id, name: t.name }))}
          activeId={teacherId}
          basePath="/principal/teachers"
          month={period.month}
          year={period.year}
        />
      </Card>

      <PeriodFilter
        period={period}
        title="Salary month"
        submitLabel="Show"
        hidden={teacherId ? { teacher_id: teacherId } : undefined}
      />

      {period.isFuture || !rows.length ? (
        <NoRecordFound />
      ) : (
        <Card
          title={teacherId ? `${rows[0]?.name} · ${period.label}` : `Teachers · ${period.label}`}
          subtitle={`${rows.length} row(s)`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Phone</th>
                  <th className="py-2 pr-3 font-semibold">Monthly salary</th>
                  <th className="py-2 pr-3 font-semibold">{period.label}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => {
                  const monthly = salaryMap[t.id] || 0;
                  const paid = paidMap[t.id];
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pr-3 font-bold text-brand-navy">{t.name}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{t.phone || "—"}</td>
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
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/principal/teachers/${t.id}`}
                          className="text-xs font-bold text-brand-accent hover:underline"
                        >
                          Profile
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
