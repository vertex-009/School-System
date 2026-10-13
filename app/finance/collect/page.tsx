import Link from "next/link";
import { collectFee } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { PeriodFilter } from "@/components/period-filter";
import { Card, Select, Submit } from "@/components/ui";
import { classNameOf } from "@/lib/class-label";
import { feeDueBreakdown } from "@/lib/fee-due";
import { pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { filterStudentsBySearch, studentSearchOr } from "@/lib/search";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

type InvRow = {
  id: string;
  student_id: string;
  amount: number;
  discount: number | null;
  paid_amount: number | null;
  status: string;
  month: number;
  year: number;
  students: {
    name?: string;
    father_name?: string;
    admission_no?: string;
    roll_no?: number | null;
    sections?: unknown;
  } | null;
};

export default async function CollectFeePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const q = String(sp.q || "").trim();
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  // No auto invoice generation on this page — use Dashboard → Generate invoices.

  type StudentBundle = {
    studentId: string;
    student: InvRow["students"];
    lines: ReturnType<typeof feeDueBreakdown>["lines"];
    totalDue: number;
    oldestId: string | undefined;
  };

  let bundles: StudentBundle[] = [];

  if (q) {
    const { data: byText } = await supabase
      .from("students")
      .select("id, name, father_name, admission_no")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .or(studentSearchOr(q))
      .limit(80);
    const matched = filterStudentsBySearch(byText || [], q);
    const ids = new Set(matched.map((s) => s.id));

    if (/^\d+$/.test(q)) {
      const { data: byRoll } = await supabase
        .from("students")
        .select("id")
        .eq("school_id", schoolId)
        .eq("status", "active")
        .eq("roll_no", Number(q))
        .limit(40);
      for (const s of byRoll || []) ids.add(s.id);
    }

    if (ids.size) {
      const { data: invoices } = await supabase
        .from("fee_invoices")
        .select(
          "id, student_id, amount, discount, paid_amount, status, month, year, students(name, father_name, admission_no, roll_no, sections(name, classes(name)))"
        )
        .eq("school_id", schoolId)
        .in("status", ["unpaid", "partial"])
        .in("student_id", [...ids])
        .order("year", { ascending: true })
        .order("month", { ascending: true })
        .limit(300);

      const byStudent = new Map<string, InvRow[]>();
      for (const inv of (invoices || []) as unknown as InvRow[]) {
        const list = byStudent.get(inv.student_id) || [];
        list.push(inv);
        byStudent.set(inv.student_id, list);
      }

      bundles = [...byStudent.entries()]
        .map(([studentId, invs]) => {
          const summary = feeDueBreakdown(invs, {
            throughMonth: period.month,
            throughYear: period.year,
          });
          return {
            studentId,
            student: invs[0]?.students || null,
            lines: summary.lines,
            totalDue: summary.totalDue,
            oldestId: summary.lines[0]?.id,
          };
        })
        .filter((b) => b.totalDue > 0);
    }
  }

  const financeName = profile.name?.trim() || "Finance";

  return (
    <Shell role="finance" title="Collect cash">
      <p className="text-sm text-slate-600">
        Search a student. Pay one full month at a time (oldest unpaid first). Generate invoices from the{" "}
        <Link href="/finance" className="font-bold text-brand-accent hover:underline">
          Dashboard
        </Link>
        . Full lists:{" "}
        <Link href="/finance/fee-records" className="font-bold text-brand-accent hover:underline">
          Student fee records
        </Link>
        .
      </p>

      <PeriodFilter
        period={period}
        title="Through month & search"
        submitLabel="Search"
        extra={
          <label className="min-w-[14rem] flex-1 text-xs font-bold text-slate-600">
            Student
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, father, admission or roll"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        }
      />

      {!q ? (
        <Card title="Collect cash">
          <p className="text-sm text-slate-500">
            Type a student name (or roll / admission) and press Search. Unpaid months through the selected period are listed.
          </p>
        </Card>
      ) : !bundles.length ? (
        <Card title={`No unpaid for “${q}” through ${period.label}`}>
          <p className="text-sm text-slate-500">
            No unpaid / partial invoices up to {period.label}. If this month was never generated, use Dashboard → Generate
            invoices.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bundles.map((b) => {
            const student = b.student;
            const klass = classNameOf(student?.sections);
            const father = student?.father_name || "";
            return (
              <Card
                key={b.studentId}
                title={student?.name || "Student"}
                subtitle={`Through ${period.label} · Total due ${pkr(b.totalDue)}`}
              >
                <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Name</dt>
                    <dd className="font-bold text-brand-navy">{student?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Roll no.</dt>
                    <dd className="font-semibold">{student?.roll_no ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Class</dt>
                    <dd className="font-semibold">{klass}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Father name</dt>
                    <dd className="font-semibold">{father || "—"}</dd>
                  </div>
                </dl>

                <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Month breakdown</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {b.lines.map((line) => (
                      <li key={line.id || `${line.month}-${line.year}`} className="flex justify-between gap-2">
                        <span className={line.id === b.oldestId ? "font-bold text-brand-navy" : "text-slate-600"}>
                          {line.label}
                          {line.id === b.oldestId ? " · pay first" : ""}
                        </span>
                        <span className="font-bold text-rose-700">{pkr(line.due)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-sm">
                    <span className="font-bold uppercase tracking-wide text-slate-500">Total due</span>
                    <span className="text-lg font-black text-brand-navy">{pkr(b.totalDue)}</span>
                  </div>
                </div>

                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Pay one full month (amount locked)
                </p>
                <div className="space-y-3">
                  {b.lines.map((line) => {
                    const isOldest = line.id === b.oldestId;
                    return (
                      <form
                        key={line.id}
                        action={async (fd) => {
                          "use server";
                          const r = await collectFee(fd);
                          if (r?.error) throw new Error(r.error);
                        }}
                        className={`grid gap-2 rounded-xl border p-3 md:grid-cols-4 ${
                          isOldest ? "border-brand-navy/40 bg-brand-soft/30" : "border-slate-100"
                        }`}
                      >
                        <input type="hidden" name="invoice_id" value={line.id} />
                        <input type="hidden" name="amount" value={String(line.due)} />
                        <input type="hidden" name="received_from" value={father} />
                        <div className="md:col-span-2 self-center text-sm">
                          {isOldest && (
                            <span className="mr-2 rounded-md bg-brand-navy px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              Default
                            </span>
                          )}
                          <span className="font-bold text-brand-navy">{line.label}</span>
                          <label className="mt-1 block text-xs font-bold text-slate-600">
                            Amount (full invoice)
                            <input
                              readOnly
                              value={line.due}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-navy"
                            />
                          </label>
                        </div>
                        <Select label="Method" name="method" defaultValue="cash">
                          <option value="cash">Cash</option>
                          <option value="bank">Bank</option>
                          <option value="jazzcash">JazzCash</option>
                          <option value="easypaisa">Easypaisa</option>
                        </Select>
                        <div className="flex flex-col justify-end gap-1">
                          <p className="text-[10px] text-slate-400">Received by {financeName}</p>
                          <Submit>{isOldest ? "Pay oldest month" : "Pay this month"}</Submit>
                        </div>
                      </form>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
