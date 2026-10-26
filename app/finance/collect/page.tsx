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
    status?: string | null;
    created_at: string | null;
    joined_on?: string | null;
    monthly_fee?: number | null;
    transport_fee?: number | null;
    misc_fee?: number | null;
    discount?: number | null;
    sections: unknown;
    paidPayment?: PaymentInfo | null;
    paidInvoice?: InvRow | null;
    paidMonth?: string | null;
    billedAmount?: number;
    paidAmount?: number;
  };

  let bundles: StudentBundle[] = [];
  let enrolledWithoutDues: EnrolledStudent[] = [];

  if (q || studentIdParam) {
    // 1. Guaranteed-safe base student query using columns present in standard schema
    const baseCols = "id, name, father_name, admission_no, roll_no, status, created_at, section_id, sections(id, name, class_id, classes(id, name))";
    let studentQuery = supabase
      .from("students")
      .select(baseCols)
      .eq("school_id", schoolId);

    if (studentIdParam) {
      studentQuery = studentQuery.eq("id", studentIdParam);
    } else {
      studentQuery = studentQuery.neq("status", "left");
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

    let { data: matchedStudents } = await studentQuery.limit(30);

    // If query failed due to nested relation syntax, fallback to simpler select
    if (!matchedStudents) {
      const fallbackQuery = supabase
        .from("students")
        .select("id, name, father_name, admission_no, roll_no, status, created_at, section_id, sections(name, classes(name))")
        .eq("school_id", schoolId);
      const res = studentIdParam
        ? await fallbackQuery.eq("id", studentIdParam).maybeSingle()
        : await fallbackQuery.limit(30);
      if (res.data) {
        matchedStudents = (Array.isArray(res.data) ? res.data : [res.data]) as any;
      }
    }

    const studentsList = (matchedStudents || []) as unknown as EnrolledStudent[];
    const ids = studentsList.map((s) => s.id);

    if (ids.length) {
      // Non-blocking attempt to fetch optional extra fee & join columns if migration was run
      try {
        const { data: optData } = await supabase
          .from("students")
          .select("id, monthly_fee, transport_fee, misc_fee, discount, joined_on")
          .in("id", ids);
        if (optData) {
          const optMap = Object.fromEntries(optData.map((o: any) => [o.id, o]));
          for (const s of studentsList) {
            const o = optMap[s.id];
            if (o) {
              s.monthly_fee = o.monthly_fee;
              s.transport_fee = o.transport_fee;
              s.misc_fee = o.misc_fee;
              s.discount = o.discount;
              s.joined_on = o.joined_on;
            }
          }
        }
      } catch {
        // Safe fallback if columns do not exist in DB yet
      }

      if (!period.isFuture) {
        const { ensureCurrentMonthInvoices } = await import("@/lib/fee-invoices");
        await ensureCurrentMonthInvoices(supabase, { month: period.month, year: period.year, dueDay: 10 });
      }

      // Safe invoice query without depending on optional joined_on
      let { data: rawInvoices } = await supabase
        .from("fee_invoices")
        .select(
          "id, student_id, amount, discount, paid_amount, status, month, year, students(name, father_name, admission_no, roll_no, created_at, sections(name, classes(name)))"
        )
        .eq("school_id", schoolId)
        .in("student_id", ids)
        .order("year", { ascending: true })
        .order("month", { ascending: true })
        .limit(300);

      if (!rawInvoices) {
        const { data: simpleInvs } = await supabase
          .from("fee_invoices")
          .select("id, student_id, amount, discount, paid_amount, status, month, year")
          .eq("school_id", schoolId)
          .in("student_id", ids)
          .order("year", { ascending: true })
          .order("month", { ascending: true })
          .limit(300);
        rawInvoices = simpleInvs as any;
      }

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
              .map((s) => (s.sections as any)?.class_id || (s.sections as any)?.classes?.id)
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
          const classId = (s.sections as any)?.class_id || (s.sections as any)?.classes?.id;
          const individualFee =
            Number(s.monthly_fee || 0) +
            Number(s.transport_fee || 0) +
            Number(s.misc_fee || 0);
          const fee = individualFee > 0 ? individualFee : Number(classFeeMap[classId] || 0);
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

        if (newInvoicesToInsert.length > 0) {
          await supabase.from("fee_invoices").upsert(newInvoicesToInsert, {
            onConflict: "student_id,month,year",
            ignoreDuplicates: true,
          });
          const { data: refreshedInvoices } = await supabase
            .from("fee_invoices")
            .select(
              "id, student_id, amount, discount, paid_amount, status, month, year, students(name, father_name, admission_no, roll_no, created_at, sections(name, classes(name)))"
            )
            .eq("school_id", schoolId)
            .in("student_id", ids)
            .order("year", { ascending: true })
            .order("month", { ascending: true });
          if (refreshedInvoices) invoices = refreshedInvoices as unknown as InvRow[];
        }
      }

      // Check payments for all student invoices to attach receipt information
      const allInvoiceIds = invoices.map((inv) => inv.id);
      const paidReceiptsMap = new Map<string, PaymentInfo>();
      if (allInvoiceIds.length > 0) {
        const { data: payments } = await supabase
          .from("payments")
          .select("id, invoice_id, amount, receipt_no, paid_at")
          .in("invoice_id", allInvoiceIds)
          .order("paid_at", { ascending: false });
        for (const p of payments || []) {
          if (p.invoice_id && !paidReceiptsMap.has(p.invoice_id)) {
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
            student: student || (sObj as unknown as InvRow["students"]),
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
          const studentInvs = invoices.filter((inv) => inv.student_id === s.id);
          const paidPeriodInv = studentInvs.find(
            (inv) => inv.month === period.month && inv.year === period.year && inv.status === "paid"
          );
          const lastPaidInv = paidPeriodInv || [...studentInvs].filter((inv) => inv.status === "paid").pop();
          const paymentInfo = lastPaidInv ? paidReceiptsMap.get(lastPaidInv.id) || null : null;
          const billedAmount = lastPaidInv ? Number(lastPaidInv.amount) : Number(s.monthly_fee || 0);
          const paidAmount = paymentInfo ? paymentInfo.amount : (lastPaidInv ? Number(lastPaidInv.paid_amount || lastPaidInv.amount) : billedAmount);
          return {
            ...s,
            paidPayment: paymentInfo,
            paidInvoice: lastPaidInv || null,
            paidMonth: lastPaidInv ? `${MONTHS[lastPaidInv.month - 1]} ${lastPaidInv.year}` : period.label,
            billedAmount,
            paidAmount,
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

          {/* Enrolled Students with No Unpaid Balance (PAID) */}
          {enrolledWithoutDues.map((s) => {
            const klass = classNameOf(s.sections);
            const paid = s.paidPayment;
            const father = s.father_name || "";
            const paidAmt = s.paidAmount || s.billedAmount || 0;
            return (
              <section
                key={s.id}
                className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-white shadow-sm"
              >
                {/* Clean Receipt Header */}
                <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-brand-navy">{s.name}</h2>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-900 border border-emerald-200">
                            {klass}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          Father: <span className="text-slate-800">{father || "—"}</span>
                          {s.roll_no != null && (
                            <> · Roll: <span className="text-slate-800 font-bold">{s.roll_no}</span></>
                          )}
                          {s.admission_no && (
                            <> · Adm No: <span className="text-slate-800 font-mono font-bold">{s.admission_no}</span></>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-right">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Fee Status</p>
                      <p className="text-xl font-black text-emerald-800 tabular-nums">
                        ✓ Paid {paidAmt > 0 ? `(${pkr(paidAmt)})` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Voucher Summary Bar */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-emerald-100 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Class:</span>
                      <p className="font-bold text-brand-navy">{klass}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Roll No:</span>
                      <p className="font-bold text-brand-navy">{s.roll_no ?? "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Admission No:</span>
                      <p className="font-mono font-bold text-brand-navy">{s.admission_no || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Billing Period:</span>
                      <p className="font-bold text-brand-navy">{period.label}</p>
                    </div>
                  </div>
                </div>

                {/* Paid Confirmation Box */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            ✓ Fee Cleared for {s.paidMonth || period.label}
                          </span>
                          {paidAmt > 0 && (
                            <span className="text-xs font-bold text-slate-700">
                              Amount: <strong className="text-emerald-800">{pkr(paidAmt)}</strong>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                          No pending balance for <strong>{period.label}</strong>. All dues are completely cleared.
                        </p>
                        {paid && (
                          <p className="text-xs font-semibold text-slate-700 mt-1">
                            Receipt: <span className="font-mono font-bold text-brand-navy">{paid.receipt_no}</span>
                            {paid.paid_at && (
                              <> · Date Paid: <span className="text-slate-800">{new Date(paid.paid_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}</span></>
                            )}
                            {paid.amount > 0 && (
                              <> · Paid Sum: <span className="font-bold text-emerald-800">{pkr(paid.amount)}</span></>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {paid && (
                          <Link
                            href={`/finance/fees/receipts/${paid.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Receipt ({paid.receipt_no})
                          </Link>
                        )}
                        <Link
                          href={`/finance/students/${s.id}`}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          View Profile →
                        </Link>
                        <Link
                          href="/finance/income-vs-expenses?tab=fees"
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          Fee Overview →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
