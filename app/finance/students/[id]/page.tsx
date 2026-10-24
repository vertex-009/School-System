import Link from "next/link";
import { EditStudentForm } from "./edit-form";
import { Shell } from "@/components/shell";
import { StudentProfileCard } from "@/components/student-profile-card";
import { StudentFeeRow } from "@/components/student-fee-row";
import { Back, Card, Field, Select, Submit } from "@/components/ui";
import { setStudentStatus } from "@/lib/actions";
import { classNameOf } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; school_done?: string; warn?: string }>;
}) {
  const { id } = await params;
  const { edit, school_done, warn } = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { data: student } = await supabase
    .from("students")
    .select("*, sections(name, classes(name))")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!student) notFound();

  const [{ data: classes }, { data: sections }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, class_id, name").eq("school_id", schoolId),
  ]);

  const sectionToClass = new Map((sections || []).map((s) => [s.id, s.class_id]));
  const currentClassId = student.section_id ? sectionToClass.get(student.section_id) || "" : "";
  const showEdit = edit === "1";

  // Fallback to class fee_structure if student's individual monthly fee is not yet set
  const { data: classFee } = currentClassId
    ? await supabase.from("fee_structure").select("monthly_fee").eq("class_id", currentClassId).maybeSingle()
    : { data: null };

  const effectiveMonthlyFee = Number(student.monthly_fee || classFee?.monthly_fee || 0);
  const effectiveAdmissionFee = Number(student.admission_fee || 0);
  const effectiveTransportFee = Number(student.transport_fee || 0);
  const effectiveMiscFee = Number(student.misc_fee || 0);
  const effectiveDiscount = Number(student.discount || 0);

  return (
    <Shell role="finance" title="Student profile">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/finance/students" label="← Back to students" />
        <div className="flex flex-wrap items-center gap-2">
          <form action={setStudentStatus.bind(null, student.id, student.status === "active" ? "left" : "active")}>
            <button
              type="submit"
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
                student.status === "active"
                  ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-300"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {student.status === "active" ? "Mark as Left School" : "✓ Re-activate Student"}
            </button>
          </form>
          {!showEdit ? (
            <Link
              href={`/finance/students/${student.id}?edit=1`}
              className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent"
            >
              Edit student
            </Link>
          ) : (
            <Link href={`/finance/students/${student.id}`} className="self-center text-xs font-bold text-brand-accent hover:underline">
              View profile
            </Link>
          )}
        </div>
      </div>

      {student.status === "left" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-950">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm shadow-xs">
              🚪
            </span>
            <div>
              <p className="text-sm font-bold text-rose-950">Student Marked as Left School</p>
              <p className="text-xs text-rose-700">This student is currently inactive. You can re-activate them anytime.</p>
            </div>
          </div>
          <form action={setStudentStatus.bind(null, student.id, "active")}>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
            >
              ✓ Re-activate Student
            </button>
          </form>
        </div>
      )}

      {school_done === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold">School transfer recorded</p>
          <p className="mt-0.5 text-xs text-emerald-800">
            Student marked left.
            {warn === "history" ? " Re-run supabase/migration_student_transfers.sql for full history." : ""}
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none">
        <StudentProfileCard
          student={{
            name: student.name,
            father_name: student.father_name,
            admission_no: student.admission_no,
            roll_no: student.roll_no,
            gender: student.gender,
            dob: student.dob,
            cnic: student.cnic,
            guardian_phone: student.guardian_phone,
            address: student.address,
            status: student.status,
            className: classNameOf(student.sections),
            joined_on: (student as any).joined_on || (student as any).created_at || null,
          }}
        />
      </section>

      {/* Student Fee Structure Row (In a row & changeable) */}
      <StudentFeeRow
        studentId={student.id}
        admissionFee={effectiveAdmissionFee}
        monthlyFee={effectiveMonthlyFee}
        transportFee={effectiveTransportFee}
        miscFee={effectiveMiscFee}
        discount={effectiveDiscount}
        canEdit={true}
      />

      {showEdit && (
        <EditStudentForm
          student={{
            id: student.id,
            name: student.name,
            father_name: student.father_name,
            cnic: student.cnic,
            guardian_phone: student.guardian_phone,
            gender: student.gender,
            dob: student.dob,
            address: student.address,
            admission_no: student.admission_no,
            roll_no: student.roll_no,
            status: student.status,
            admission_fee: effectiveAdmissionFee,
            monthly_fee: effectiveMonthlyFee,
            transport_fee: effectiveTransportFee,
            misc_fee: effectiveMiscFee,
            discount: effectiveDiscount,
          }}
          classes={classes || []}
          currentClassId={currentClassId}
        />
      )}
    </Shell>
  );
}
