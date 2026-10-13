import { Shell } from "@/components/shell";
import { StudentProfileCard } from "@/components/student-profile-card";
import { Back } from "@/components/ui";
import { classNameOf } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function StudentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, name, admission_no, father_name, guardian_phone, gender, dob, address, roll_no, status, cnic, sections(name, classes(name))"
    )
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!student) redirect("/principal/students");

  return (
    <Shell role="principal" title="Student profile">
      <Back href="/principal/students" label="← Back to students" />
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
        }}
      />
      <p className="text-xs text-slate-500">View only. Finance can edit student records.</p>
    </Shell>
  );
}
