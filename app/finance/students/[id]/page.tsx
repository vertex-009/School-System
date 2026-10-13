import Link from "next/link";
import { saveStudent } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { StudentProfileCard } from "@/components/student-profile-card";
import { Back, Card, Field, Select, Submit } from "@/components/ui";
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

  return (
    <Shell role="finance" title="Student profile">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/finance/students" label="← Back to students" />
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/finance/students/school-transfer?student=${student.id}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy hover:bg-slate-50"
          >
            School transfer
          </Link>
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
          }}
        />
      </section>

      {showEdit && (
        <Card title="Edit student" subtitle="Update and save changes.">
          <form action={saveStudent} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={student.id} />
            <Field label="Name" name="name" defaultValue={student.name} required />
            <Field label="Father name" name="father_name" defaultValue={student.father_name || ""} />
            <Field label="CNIC" name="cnic" defaultValue={student.cnic || ""} required placeholder="12345-1234567-1" inputMode="numeric" />
            <Field label="Guardian phone" name="guardian_phone" defaultValue={student.guardian_phone || ""} />
            <Field label="Gender" name="gender" defaultValue={student.gender || ""} />
            <Field label="Date of birth" name="dob" type="date" defaultValue={student.dob || ""} />
            <Field label="Address" name="address" defaultValue={student.address || ""} />
            <Field label="Admission number" name="admission_no" defaultValue={student.admission_no} required />
            <Field label="Roll number" name="roll_no" type="number" defaultValue={student.roll_no ?? ""} />
            <Select label="Class" name="class_id" defaultValue={currentClassId} required>
              <option value="">Select class</option>
              {(classes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select label="Status" name="status" defaultValue={student.status}>
              <option value="active">Active</option>
              <option value="left">Left</option>
            </Select>
            <div className="md:col-span-2">
              <Submit>Save</Submit>
            </div>
          </form>
        </Card>
      )}
    </Shell>
  );
}
