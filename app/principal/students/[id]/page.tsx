import { Shell } from "@/components/shell";
import { StudentProfileCard } from "@/components/student-profile-card";
import { StudentFeeRow } from "@/components/student-fee-row";
import { Back } from "@/components/ui";
import { setStudentStatus } from "@/lib/actions";
import { classNameOf } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function StudentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  let { data: student, error } = await supabase
    .from("students")
    .select(
      "id, name, admission_no, father_name, guardian_phone, gender, dob, address, roll_no, status, cnic, created_at, joined_on, admission_fee, monthly_fee, transport_fee, misc_fee, discount, section_id, sections(name, class_id, classes(name))"
    )
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (error || !student) {
    const fallback = await supabase
      .from("students")
      .select("id, name, admission_no, father_name, guardian_phone, gender, dob, address, roll_no, status, created_at, joined_on, sections(name, classes(name))")
      .eq("id", id)
      .eq("school_id", schoolId)
      .maybeSingle();
    student = fallback.data as typeof student;
  }

  if (!student) redirect("/principal/students");

  const classId = (student.sections as any)?.class_id || null;
  const { data: classFee } = classId
    ? await supabase.from("fee_structure").select("monthly_fee").eq("class_id", classId).maybeSingle()
    : { data: null };

  const effectiveMonthlyFee = Number((student as any).monthly_fee || classFee?.monthly_fee || 0);
  const effectiveAdmissionFee = Number((student as any).admission_fee || 0);
  const effectiveTransportFee = Number((student as any).transport_fee || 0);
  const effectiveMiscFee = Number((student as any).misc_fee || 0);
  const effectiveDiscount = Number((student as any).discount || 0);

  return (
    <Shell role="principal" title="Student profile">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Back href="/principal/students" label="← Back to students" />
          <div className="flex flex-wrap items-center gap-2">
            <form action={setStudentStatus.bind(null, student.id, student.status === "active" ? "left" : "active")}>
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
                  student.status === "active"
                    ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-300"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {student.status === "active" ? "Mark as Left School" : "✓ Re-activate Student"}
              </button>
            </form>
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

        <StudentProfileCard
          student={{
            name: student.name,
            father_name: student.father_name,
            admission_no: student.admission_no,
            roll_no: student.roll_no,
            gender: student.gender,
            dob: student.dob,
            cnic: (student as { cnic?: string | null }).cnic || null,
            guardian_phone: student.guardian_phone,
            address: student.address,
            status: student.status,
            photo_url: (student as { photo_url?: string | null }).photo_url || null,
            className: classNameOf(student.sections),
            joined_on: (student as any).joined_on || (student as any).created_at || null,
          }}
        />

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
      </div>
    </Shell>
  );
}
