import Link from "next/link";
import { generateInvoices } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card, Submit } from "@/components/ui";
import { classNameOf } from "@/lib/class-label";
import { invoiceDue } from "@/lib/fee-due";
import { MONTHS, pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

type Tab = "paid" | "unpaid";

export default async function FeeRecordsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const tab = (sp.tab === "paid" ? "paid" : "unpaid") as Tab;
  const period = parsePeriod(sp);

  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  // No auto generation — Dashboard / Generate button only.

  let query = supabase
    .from("fee_invoices")
    .select(
      "id, student_id, amount, discount, paid_amount, status, due_date, month, year, students(name, admission_no, roll_no, sections(name, classes(name)))"
    )
    .eq("school_id", schoolId)
    .eq("month", period.month)
    .eq("year", period.year)
    .order("due_date");

  if (tab === "paid") query = query.eq("status", "paid");
  else query = query.in("status", ["unpaid", "partial"]);

  const { data: rows } = await query;
  const list = rows || [];

  /** Prior unpaid/partial balance per student + month labels for breakdown tip. */
  const arrearsByStudent = new Map<string, number>();
  const arrearsLabelByStudent = new Map<string, string>();
  if (tab === "unpaid" && list.length) {
    const { data: prior } = await supabase
      .from("fee_invoices")
      .select("student_id, amount, discount, paid_amount, month, year, status")
      .eq("school_id", schoolId)
      .in("status", ["unpaid", "partial"])
      .limit(2000);
    const through = period.year * 12 + period.month;
    const labels = new Map<string, string[]>();
    for (const inv of prior || []) {
      if (inv.year * 12 + inv.month >= through) continue;
      const due = invoiceDue(inv);
      if (due <= 0) continue;
      arrearsByStudent.set(inv.student_id, (arrearsByStudent.get(inv.student_id) || 0) + due);
      const arr = labels.get(inv.student_id) || [];
      arr.push(`${MONTHS[inv.month - 1]} ${inv.year}`);
      labels.set(inv.student_id, arr);
    }
    for (const [sid, arr] of labels) {
      arrearsLabelByStudent.set(sid, arr.join(", "));
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "paid", label: "Paid" },
    { id: "unpaid", label: "Unpaid" },
  ];

  return (
    <Shell role="finance" title="Student fee records">
      <PeriodFilter period={period} title="Month" hidden={{ tab }} />

      <p className="text-sm text-slate-600">
        Need invoices for {period.label}? Use{" "}
        <Link href="/finance" className="font-bold text-brand-accent underline">
          Dashboard → Generate invoices for this month
        </Link>
        .
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/finance/fee-records?tab=${t.id}&month=${period.month}&year=${period.year}`}
              className={`rounded-full px-4 py-2 text-xs font-bold ${tab === t.id ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        {!period.isFuture && (
          <form
            action={async () => {
              "use server";
              const fd = new FormData();
              fd.set("month", String(period.month));
              fd.set("year", String(period.year));
              fd.set("due_day", "10");
              const r = await generateInvoices(fd);
              if (r?.error) throw new Error(r.error);
            }}
          >
            <Submit>Generate invoices · {period.label}</Submit>
          </form>
        )}
      </div>

      {period.isFuture && (
        <p className="text-xs text-amber-800">Future months are browse-only. Generate is blocked for future months.</p>
      )}

      <Card
        title={`${tab === "paid" ? "Paid" : "Unpaid"} · ${period.label}`}
        subtitle={
          list.length
            ? `${list.length} invoices${tab === "unpaid" ? " · Total due = this month + prior unpaid months" : ""}`
            : undefined
        }
      >
        {!list.length ? (
          <NoHistory period={period} what={`${tab} fee invoices`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-slate-500">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Roll</th>
                  <th className="py-2 pr-2">Admission</th>
                  <th className="py-2 pr-2">Class</th>
                  <th className="py-2 pr-2">Month</th>
                  <th className="py-2 pr-2">Fee</th>
                  <th className="py-2 pr-2">Paid</th>
                  <th className="py-2 pr-2">Balance</th>
                  {tab === "unpaid" && <th className="py-2 pr-2">Prior months</th>}
                  {tab === "unpaid" && <th className="py-2 pr-2">Arrears</th>}
                  {tab === "unpaid" && <th className="py-2 pr-2">Total due</th>}
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => {
                  const s = inv.students as {
                    name?: string;
                    admission_no?: string;
                    roll_no?: number;
                    sections?: unknown;
                  } | null;
                  const net = Number(inv.amount) - Number(inv.discount || 0);
                  const paidAmt = Number(inv.paid_amount || 0);
                  const bal = invoiceDue(inv);
                  const arrears = arrearsByStudent.get(inv.student_id) || 0;
                  const priorLabel = arrearsLabelByStudent.get(inv.student_id) || "—";
                  const statusLabel = inv.status === "paid" ? "Paid" : inv.status === "partial" ? "Partial" : "Unpaid";
                  return (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2 pr-2 font-bold">{s?.name || "—"}</td>
                      <td className="py-2 pr-2">{s?.roll_no ?? "—"}</td>
                      <td className="py-2 pr-2">{s?.admission_no}</td>
                      <td className="py-2 pr-2">{classNameOf(s?.sections)}</td>
                      <td className="py-2 pr-2 whitespace-nowrap">{period.label}</td>
                      <td className="py-2 pr-2">{pkr(net)}</td>
                      <td className="py-2 pr-2 text-emerald-700">{pkr(paidAmt)}</td>
                      <td className="py-2 pr-2 text-rose-700">{pkr(bal)}</td>
                      {tab === "unpaid" && (
                        <td className="py-2 pr-2 text-xs text-slate-500">{priorLabel}</td>
                      )}
                      {tab === "unpaid" && (
                        <td className="py-2 pr-2 text-rose-700">{pkr(arrears)}</td>
                      )}
                      {tab === "unpaid" && (
                        <td className="py-2 pr-2 font-bold text-brand-navy">{pkr(bal + arrears)}</td>
                      )}
                      <td className="py-2">{statusLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}
