import Link from "next/link";
import { saveStudent } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Select, Submit } from "@/components/ui";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function NewStudentPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");

  return (
    <Shell role="finance" title="Add Student">
      <Link href="/finance" className="text-xs font-bold text-brand-accent hover:underline">
        ← Dashboard
      </Link>
      <Card title="New student" subtitle="CNIC is required. Pick a class.">
        <form action={saveStudent} className="grid gap-3 md:grid-cols-2">
          <Field label="Name" name="name" required />
          <Field label="Father name" name="father_name" />
          <Field label="CNIC" name="cnic" required placeholder="12345-1234567-1" inputMode="numeric" />
          <Field label="Guardian phone" name="guardian_phone" />
          <Field label="Gender" name="gender" />
          <Field label="Date of birth" name="dob" type="date" />
          <Field label="Address" name="address" />
          <Field label="Admission number" name="admission_no" required />
          <Field label="Roll number" name="roll_no" type="number" />
          <Select label="Class" name="class_id" required>
            <option value="">Select class</option>
            {(classes || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Status" name="status" defaultValue="active">
            <option value="active">Active</option>
            <option value="left">Left</option>
          </Select>
          <div className="md:col-span-2">
            <Submit>Save student</Submit>
          </div>
        </form>
      </Card>
    </Shell>
  );
}
