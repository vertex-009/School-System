import Link from "next/link";
import { Shell } from "@/components/shell";
import { classNameOf } from "@/lib/class-label";
import { feeDueBreakdown } from "@/lib/fee-due";
import { MONTHS, pkr } from "@/lib/format";
import { parsePeriod, toMonthKey } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { StudentSearchBar } from "./student-search-bar";
import { CollectFeeLineForm } from "./collect-fee-form";

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
    created_at?: string;
    joined_on?: string;
    sections?: unknown;
  } | null;
};

type PaymentInfo = {
  id: string;
  receipt_no: string;
  amount: number;
  paid_at: string;
};

function admissionPeriod(joinedOrCreated?: string | null) {
  if (!joinedOrCreated) return null;
  const key = toMonthKey(joinedOrCreated);
  if (key == null) return null;
  const year = Math.floor((key - 1) / 12);
  const month = ((key - 1) % 12) + 1;
  return { month, year };
}

export default async function CollectFeePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; student_id?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const q = String(sp.q || "").trim();
  const studentIdParam = String(sp.student_id || "").trim();
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  type StudentBundle = {
    studentId: string;
    student: InvRow["students"];
    lines: ReturnType<typeof feeDueBreakdown>["lines"];
    totalDue: number;
    oldestId: string | undefined;
    fromLabel: string | null;
  };

  type EnrolledStudent = {
    id: string;
    name: string;
    father_name: string | null;
    admission_no: string;
    roll_no: number | null;
    created_at: string | null;
    joined_on?: string | null;
    monthly_fee?: number | null;
    transport_fee?: number | null;
    misc_fee?: number | null;
    discount?: number | null;
    sections: unknown;
    paidPayment?: PaymentInfo | null;
  };

  let bundles: StudentBundle[] = [];
  let enrolledWithoutDues: EnrolledStudent[] = [];

  if (q || studentIdParam) {
    let studentQuery = supabase
      .from("students")
      .select("id, name, father_name, admission_no, roll_no, created_at, joined_on, monthly_fee, transport_fee, misc_fee, discount, section_id, sections(name, class_id, classes(name))")
      .eq("school_id", schoolId)
      .eq("status", "active");

    if (studentIdParam) {
      studentQuery = studentQuery.eq("id", studentIdParam);
    } else {
      const cleanQ = q.replace(/[%_\\]/g, "").trim();
      const digits = cleanQ.replace(/\D/g, "");
      if (digits) {
        studentQuery = studentQuery.or(
          `roll_no.eq.${digits},admission_no.ilike.%${digits}%,admission_no.ilike.%${cleanQ}%,name.ilike.%${cleanQ}%,father_name.ilike.%${cleanQ}%`
        );
      } else {
        studentQuery = studentQuery.or(
          `name.ilike.%${cleanQ}%,father_name.ilike.%${cleanQ}%,admission_no.ilike.%${cleanQ}%`
        );
      }
    }

    const { data: matchedStudents } = await studentQuery.limit(30);
    const studentsList = (matchedStudents || []) as unknown as EnrolledStudent[];
    const ids = studentsList.map((s) => s.id);

    if (ids.length) {
      if (!period.isFuture) {
        const { ensureCurrentMonthInvoices } = await import("@/lib/fee-invoices");
        await ensureCurrentMonthInvoices(supabase, { month: period.month, year: period.year, dueDay: 10 });
      }

      let { data: rawInvoices } = await supabase
        .from("fee_invoices")
        .select(
          "id, student_id, amount, discount, paid_amount, status, month, year, students(name, father_name, admission_no, roll_no, created_at, joined_on, sections(name, classes(name)))"
        )
        .eq("school_id", schoolId)
        .in("student_id", ids)
        .order("year", { ascending: true })
        .order("month", { ascending: true })
        .limit(300);

      let invoices = (rawInvoices || []) as unknown as InvRow[];

      // If any matched student does not yet have an invoice for this period, ensure it now
      const existingPeriodInvoices = new Set(
        invoices
          .filter((i) => i.month === period.month && i.year === period.year)
          .map((i) => i.student_id)
      );

      const missingStudents = studentsList.filter((s) => !existingPeriodInvoices.has(s.id));
      if (missingStudents.length > 0 && !period.isFuture) {
        const classIds = [
          ...new Set(
            missingStudents
              .map((s) => (s.sections as any)?.class_id)
              .filter(Boolean)
          ),
        ];
        let classFeeMap: Record<string, number> = {};
        if (classIds.length > 0) {
          const { data: classFees } = await supabase
            .from("fee_structure")
            .select("class_id, monthly_fee")
            .in("class_id", classIds);
          classFeeMap = Object.fromEntries(
            (classFees || []).map((cf) => [cf.class_id, Number(cf.monthly_fee || 0)])
          );
        }

        const newInvoicesToInsert = [];
        for (const s of missingStudents) {
          const classId = (s.sections as any)?.class_id;
          const individualFee =
            Number(s.monthly_fee || 0) +
            Number(s.transport_fee || 0) +
            Number(s.misc_fee || 0);
          const fee = individualFee > 0 ? individualFee : Number(classFeeMap[classId] || 0);
          if (fee > 0) {
            const disc = Math.min(Number(s.discount || 0), fee);
            newInvoicesToInsert.push({
              school_id: schoolId,
              student_id: s.id,
              month: period.month,
              year: period.year,
              amount: fee,
              discount: disc,
              status: "unpaid",
              due_date: `${period.year}-${String(period.month).padStart(2, "0")}-10`,
            });
          }
        }

        if (newInvoicesToInsert.length > 0) {
          await supabase.from("fee_invoices").insert(newInvoicesToInsert);
          const { data: refreshedInvoices } = await supabase
            .from("fee_invoices")
            .select(
              "id, student_id, amount, discount, paid_amount, status, month, year, students(name, father_name, admission_no, roll_no, created_at, joined_on, sections(name, classes(name)))"
            )
            .eq("school_id", schoolId)
            .in("student_id", ids)
            .order("year", { ascending: true })
            .order("month", { ascending: true });
          if (refreshedInvoices) invoices = refreshedInvoices as unknown as InvRow[];
        }
      }

      // Check payments for invoices in this period so we can show receipt info if paid
      const periodInvoiceIds = invoices
        .filter((inv) => inv.month === period.month && inv.year === period.year && inv.status === "paid")
        .map((inv) => inv.id);

      const paidReceiptsMap = new Map<string, PaymentInfo>();
      if (periodInvoiceIds.length > 0) {
        const { data: payments } = await supabase
          .from("payments")
          .select("id, invoice_id, amount, receipt_no, paid_at")
          .in("invoice_id", periodInvoiceIds);
        for (const p of payments || []) {
          if (p.invoice_id) {
            paidReceiptsMap.set(p.invoice_id, {
              id: p.id,
              receipt_no: p.receipt_no || "REC",
              amount: Number(p.amount || 0),
              paid_at: String(p.paid_at || ""),
            });
          }
        }
      }

      // Filter only open/partial invoices for due collection
      const unpaidInvoices = invoices.filter((inv) => inv.status === "unpaid" || inv.status === "partial");

      const byStudent = new Map<string, InvRow[]>();
      for (const inv of unpaidInvoices) {
        const list = byStudent.get(inv.student_id) || [];
        list.push(inv);
        byStudent.set(inv.student_id, list);
      }

      const studentsWithDues = new Set<string>();

      bundles = [...byStudent.entries()]
        .map(([sId, invs]) => {
          const student = invs[0]?.students || null;
          const sObj = studentsList.find((s) => s.id === sId);
          const adm = admissionPeriod(sObj?.joined_on || sObj?.created_at || (student as any)?.joined_on || student?.created_at);
          const summary = feeDueBreakdown(invs, {
            throughMonth: period.month,
            throughYear: period.year,
            ...(adm ? { fromMonth: adm.month, fromYear: adm.year } : {}),
          });
          if (summary.totalDue > 0) {
            studentsWithDues.add(sId);
          }
          return {
            studentId: sId,
            student,
            lines: summary.lines,
            totalDue: summary.totalDue,
            oldestId: summary.lines[0]?.id,
            fromLabel: adm ? `${MONTHS[adm.month - 1]} ${adm.year}` : null,
          };
        })
        .filter((b) => b.totalDue > 0);

      enrolledWithoutDues = studentsList
        .filter((s) => !studentsWithDues.has(s.id))
        .map((s) => {
          const paidPeriodInv = invoices.find(
            (inv) => inv.student_id === s.id && inv.month === period.month && inv.year === period.year && inv.status === "paid"
          );
          const paymentInfo = paidPeriodInv ? paidReceiptsMap.get(paidPeriodInv.id) || null : null;
          return {
            ...s,
            paidPayment: paymentInfo,
          };
        });
    }
  }

  const financeName = profile.name?.trim() || "Finance";

  return (
    <Shell role="finance" title="Fee collection">
      {/* Top Header Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#0b1f3a] via-[#102d54] to-[#1a5276] p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Counter Billing &amp; Receipts
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Fee Collection
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-200">
              Search any active student by name, roll number, or admission number to collect monthly fees.
            </p>
          </div>
          <Link
            href="/finance/income-vs-expenses?tab=fees"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            Fee Overview &amp; History →
          </Link>
        </div>
      </section>

      {/* Period & Autocomplete Search Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold text-slate-700">
              Month
              <select
                name="month"
                defaultValue={String(period.month)}
                className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-navy outline-none focus:border-brand-sky"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-bold text-slate-700">
              Year
              <input
                name="year"
                type="number"
                min={2000}
                max={2100}
                defaultValue={period.year}
                className="mt-1 block w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-navy outline-none focus:border-brand-sky"
              />
            </label>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Search Student (Name, Roll #, or Adm #)
            </label>
            <StudentSearchBar
              defaultValue={q}
              defaultStudentId={studentIdParam}
              month={period.month}
              year={period.year}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-brand-accent active:scale-95 cursor-pointer"
            >
              Search
            </button>
            <Link
              href="/finance/income-vs-expenses?tab=fees"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-white hover:border-slate-300 transition shadow-xs text-center whitespace-nowrap"
            >
              Fee Overview →
            </Link>
          </div>
        </form>
      </div>

      {!q && !studentIdParam ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-brand-navy">Search Student to Collect Fee</h3>
          <p className="text-xs text-slate-500 mt-1">
            Type student name, roll number, or admission number above.
          </p>
        </div>
      ) : !bundles.length && !enrolledWithoutDues.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <p className="text-sm font-semibold text-slate-700">No active student matched &ldquo;{q}&rdquo;.</p>
          <p className="text-xs text-slate-400 mt-1">Verify spelling, roll number, or check the Student Directory.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Fee Receipt / Voucher Presentation for Students With Dues */}
          {bundles.map((b) => {
            const student = b.student;
            const klass = classNameOf(student?.sections);
            const father = student?.father_name || "";
            return (
              <section
                key={b.studentId}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
              >
                {/* Clean Receipt Header */}
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50/40 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white shadow-xs">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-brand-navy">{student?.name || "Student"}</h2>
                          <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-extrabold text-brand-navy">
                            {klass}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          Father: <span className="text-slate-800">{father || "—"}</span>
                          {student?.roll_no != null && (
                            <> · Roll: <span className="text-slate-800 font-bold">{student.roll_no}</span></>
                          )}
                          {student?.admission_no && (
                            <> · Adm No: <span className="text-slate-800 font-mono font-bold">{student.admission_no}</span></>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-right">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Total Due Balance</p>
                      <p className="text-xl font-black text-rose-800 tabular-nums">{pkr(b.totalDue)}</p>
                    </div>
                  </div>

                  {/* Voucher Summary Bar */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Class:</span>
                      <p className="font-bold text-brand-navy">{klass}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Roll No:</span>
                      <p className="font-bold text-brand-navy">{student?.roll_no ?? "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Admission No:</span>
                      <p className="font-mono font-bold text-brand-navy">{student?.admission_no || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Billing Period:</span>
                      <p className="font-bold text-brand-navy">{period.label}</p>
                    </div>
                  </div>
                </div>

                {/* Receipt Fee Collection Lines */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-4">
                    {b.lines.map((line) => (
                      <CollectFeeLineForm
                        key={line.id}
                        line={line}
                        fatherName={father}
                        financeName={financeName}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          {/* Enrolled Students with No Unpaid Balance */}
          {enrolledWithoutDues.map((s) => {
            const klass = classNameOf(s.sections);
            const paid = s.paidPayment;
            return (
              <div
                key={s.id}
                className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-brand-navy">{s.name}</h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        {paid ? "Fee Paid for " + period.label : "Enrolled & Active"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class: <b>{klass}</b> · Roll: <b>{s.roll_no ?? "—"}</b> · Adm: <b className="font-mono">{s.admission_no}</b> · Father: <b>{s.father_name || "—"}</b>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {paid && (
                      <Link
                        href={`/finance/fees/receipts/${paid.id}`}
                        className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                      >
                        Print Receipt ({paid.receipt_no})
                      </Link>
                    )}
                    <Link
                      href={`/finance/students/${s.id}`}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <p>
                    ✓ No pending fee balance for <b>{period.label}</b>.
                  </p>
                  <Link
                    href="/finance/income-vs-expenses?tab=fees"
                    className="font-bold text-brand-accent hover:underline"
                  >
                    View All Fee Records →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
