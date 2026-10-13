import Link from "next/link";
import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { MONTHS, pkr } from "@/lib/format";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherSalaryHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const period = parsePeriod(sp);
  const yearView = sp.view === "year";

  const [{ data: me }, { data: salaryRow }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("joined_on, left_on").eq("id", profile.id).maybeSingle(),
    supabase
      .from("teacher_salaries")
      .select("monthly_salary")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .maybeSingle(),
    yearView
      ? supabase
          .from("salary_payments")
          .select("id, amount, month, year, receipt_no, paid_at, method")
          .eq("school_id", schoolId)
          .eq("teacher_id", profile.id)
          .eq("year", period.year)
          .order("month", { ascending: false })
      : supabase
          .from("salary_payments")
          .select("id, amount, month, year, receipt_no, paid_at, method")
          .eq("school_id", schoolId)
          .eq("teacher_id", profile.id)
          .eq("month", period.month)
          .eq("year", period.year)
          .order("paid_at", { ascending: false }),
  ]);

  const monthly = Number(salaryRow?.monthly_salary || 0);
  const joinedOn = me?.joined_on || null;
  const leftOn = me?.left_on || null;
  const inWindow = inEmploymentWindow(joinedOn, leftOn, period);

  type Row = {
    key: string;
    label: string;
    amount: number;
    paid: boolean;
    paid_at?: string;
    receipt_no?: string;
    method?: string;
    id?: string;
  };

  let showRows: Row[] = [];

  if (yearView) {
    const byMonth = new Map((payments || []).map((p) => [p.month, p]));
    showRows = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthPeriod = parsePeriod({ month: m, year: period.year });
      if (!inEmploymentWindow(joinedOn, leftOn, monthPeriod)) return null;
      const p = byMonth.get(m);
      // Past months in window: only show if paid. Current: show paid or unpaid.
      if (monthPeriod.isPast && !p) return null;
      if (monthPeriod.isFuture) return null;
      return {
        key: `${period.year}-${m}`,
        label: `${MONTHS[i]} ${period.year}`,
        amount: p ? Number(p.amount) : monthly,
        paid: !!p,
        paid_at: p?.paid_at,
        receipt_no: p?.receipt_no,
        method: p?.method,
        id: p?.id,
      };
    })
      .filter(Boolean)
      .reverse() as Row[];
  } else if (!inWindow) {
    showRows = [];
  } else if ((payments || []).length) {
    showRows = (payments || []).map((p) => ({
      key: p.id,
      label: `${MONTHS[p.month - 1]} ${p.year}`,
      amount: Number(p.amount),
      paid: true,
      paid_at: p.paid_at,
      receipt_no: p.receipt_no,
      method: p.method,
      id: p.id,
    }));
  } else if (period.isCurrent) {
    showRows = [
      {
        key: `remain-${period.month}-${period.year}`,
        label: period.label,
        amount: monthly,
        paid: false,
      },
    ];
  }

  return (
    <Shell role="teacher" title="Salary history">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/teacher/salary" className="text-xs font-bold text-brand-accent hover:underline">
          ← Current month
        </Link>
        <div className="flex gap-2 text-xs font-bold">
          <Link
            href={`/teacher/salary/history?month=${period.month}&year=${period.year}`}
            className={`rounded-lg px-3 py-1.5 ${!yearView ? "bg-brand-navy text-white" : "border border-slate-200 text-slate-600"}`}
          >
            By month
          </Link>
          <Link
            href={`/teacher/salary/history?year=${period.year}&view=year`}
            className={`rounded-lg px-3 py-1.5 ${yearView ? "bg-brand-navy text-white" : "border border-slate-200 text-slate-600"}`}
          >
            Full year
          </Link>
        </div>
      </div>

      <PeriodFilter
        period={period}
        title="Filter"
        hidden={yearView ? { view: "year" } : undefined}
        submitLabel="Show"
      />

      {joinedOn && (
        <p className="text-sm text-slate-600">
          Joined <b>{joinedOn}</b>
          {leftOn ? (
            <>
              {" "}
              · Left <b>{leftOn}</b>
            </>
          ) : null}
          {monthly > 0 ? (
            <>
              {" "}
              · Booked <b className="text-brand-navy">{pkr(monthly)}</b>/month
            </>
          ) : null}
        </p>
      )}

      {!showRows.length ? (
        <NoRecordFound />
      ) : (
        <Card
          title={yearView ? `${period.year} · employment months` : period.label}
          subtitle={`${showRows.length} row(s)`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Month</th>
                  <th className="py-2.5 pr-3 font-semibold">Amount</th>
                  <th className="py-2.5 pr-3 font-semibold">Status</th>
                  <th className="py-2.5 pr-3 font-semibold">Date & time</th>
                  <th className="py-2.5 pr-3 font-semibold">Receipt</th>
                  <th className="py-2.5 font-semibold">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {showRows.map((r) => (
                  <tr key={r.key} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 font-bold text-brand-navy">{r.label}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{pkr(r.amount)}</td>
                    <td className="py-2.5 pr-3">
                      {r.paid ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          Paid
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                          Remaining
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      {r.paid_at ? new Date(r.paid_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">{r.receipt_no || "—"}</td>
                    <td className="py-2.5">
                      {r.paid && r.id ? (
                        <Link
                          href={`/teacher/salary/receipt/${r.id}`}
                          target="_blank"
                          className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-accent"
                        >
                          Print
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Shell>
  );
}
