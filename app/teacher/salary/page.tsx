import Link from "next/link";
import { Shell } from "@/components/shell";
import { NoRecordFound } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { MONTHS, pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherSalaryPage() {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const period = parsePeriod();
  const monthLabel = period.label;

  const [{ data: me }, { data: salaryRow }, { data: thisPay }] = await Promise.all([
    supabase.from("profiles").select("joined_on, left_on").eq("id", profile.id).maybeSingle(),
    supabase
      .from("teacher_salaries")
      .select("monthly_salary")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .maybeSingle(),
    supabase
      .from("salary_payments")
      .select("id, amount, receipt_no, paid_at, method")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .eq("month", period.month)
      .eq("year", period.year)
      .maybeSingle(),
  ]);

  const monthly = Number(salaryRow?.monthly_salary || 0);
  const paid = !!thisPay;
  const inWindow = inEmploymentWindow(me?.joined_on, me?.left_on, period);

  return (
    <Shell role="teacher" title="My salary">
      {!inWindow ? (
        <>
          <NoRecordFound />
          <Card title="History">
            <Link
              href="/teacher/salary/history"
              className="inline-flex rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent"
            >
              View past salary history →
            </Link>
          </Card>
        </>
      ) : (
        <>
          <div
            className={`rounded-2xl border px-5 py-5 ${
              paid
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
                : "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Current month</p>
                <p className="mt-1 text-xl font-black text-brand-navy">{monthLabel}</p>
                {me?.joined_on && (
                  <p className="mt-1 text-xs text-slate-500">Joined {me.joined_on}</p>
                )}
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Monthly salary</p>
                <p className="mt-0.5 text-3xl font-black tabular-nums text-brand-navy">
                  {monthly > 0 ? pkr(monthly) : "Not set"}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-4 py-1.5 text-sm font-black text-white ${
                    paid ? "bg-emerald-600" : "bg-amber-600"
                  }`}
                >
                  {paid ? "Paid" : "Remaining"}
                </span>
                {paid && thisPay && (
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>
                      Received <b className="text-emerald-700">{pkr(thisPay.amount)}</b>
                    </p>
                    <p>{new Date(thisPay.paid_at).toLocaleString()}</p>
                    <Link
                      href={`/teacher/salary/receipt/${thisPay.id}`}
                      target="_blank"
                      className="mt-2 inline-block rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-accent"
                    >
                      Print receipt
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Card title="History" subtitle="Months from your join date until leave">
            <Link
              href="/teacher/salary/history"
              className="inline-flex rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent"
            >
              View salary history →
            </Link>
          </Card>
        </>
      )}
    </Shell>
  );
}
