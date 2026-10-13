import Link from "next/link";
import { assignTeacher } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Select, Submit } from "@/components/ui";
import { primarySectionIdByClass } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AssignPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  const [{ data: teachers }, { data: classes }, { data: sections }, { data: subjects }] = await Promise.all([
    supabase.from("profiles").select("id, name").eq("school_id", schoolId).eq("role", "teacher").eq("is_active", true),
    supabase.from("classes").select("id, name").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, name, class_id, classes(name)"),
    supabase.from("subjects").select("id, name").eq("school_id", schoolId),
  ]);

  const primary = primarySectionIdByClass(sections || []);
  const classOptions = (classes || [])
    .map((c) => ({ id: c.id, name: c.name, sectionId: primary.get(c.id) }))
    .filter((c) => c.sectionId);

  return (
    <Shell role="principal" title="Assign teacher">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Assign a teacher to a class + subject.</p>
        <Link href="/principal/assign/history" className="text-xs font-bold text-brand-accent hover:underline">
          View history →
        </Link>
      </div>

      {readOnly ? (
        <Card title="Assign">
          <p className="text-sm text-slate-500">Read only.</p>
        </Card>
      ) : (
        <Card title="New assignment" subtitle="Teacher · class · subject">
          <form action={assignTeacher} className="grid gap-3 md:grid-cols-4">
            <Select label="Teacher" name="teacher_id" required defaultValue="">
              <option value="" disabled>
                Select teacher
              </option>
              {(teachers || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Select label="Class" name="section_id" required defaultValue="">
              <option value="" disabled>
                Select class
              </option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.sectionId!}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select label="Subject" name="subject_id" required defaultValue="">
              <option value="" disabled>
                Select subject
              </option>
              {(subjects || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <div className="self-end">
              <Submit>Assign</Submit>
            </div>
          </form>
        </Card>
      )}
    </Shell>
  );
}
