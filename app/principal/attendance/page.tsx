import { AttendanceForm } from "@/components/attendance-form";
import { Shell } from "@/components/shell";
import { Card, Select } from "@/components/ui";
import { primarySectionIdByClass } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ section_id?: string; date?: string }> }) {
  const { section_id, date } = await searchParams;
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  const day = date || new Date().toISOString().slice(0, 10);

  const [{ data: classes }, { data: sections }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, name, class_id").eq("school_id", schoolId),
  ]);
  const primary = primarySectionIdByClass(sections || []);
  const classOptions = (classes || [])
    .map((c) => ({ id: c.id, name: c.name, sectionId: primary.get(c.id) }))
    .filter((c) => c.sectionId);

  const sectionId = section_id || classOptions[0]?.sectionId || "";
  let students: { id: string; name: string; admission_no: string }[] = [];
  let existing: Record<string, string> = {};
  if (sectionId) {
    const [{ data: studs }, { data: rows }] = await Promise.all([
      supabase.from("students").select("id, name, admission_no").eq("section_id", sectionId).eq("status", "active").order("name"),
      supabase.from("attendance").select("student_id, status").eq("section_id", sectionId).eq("date", day),
    ]);
    students = studs || [];
    existing = Object.fromEntries((rows || []).map((r) => [r.student_id, r.status]));
  }

  return (
    <Shell role="principal" title="Attendance">
      <Card title="Pick class">
        <form className="grid gap-3 md:grid-cols-3">
          <Select label="Class" name="section_id" defaultValue={sectionId}>
            {classOptions.map((c) => (
              <option key={c.id} value={c.sectionId!}>
                {c.name}
              </option>
            ))}
          </Select>
          <label className="block text-xs font-bold text-slate-600">
            Date
            <input
              type="date"
              name="date"
              defaultValue={day}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          </label>
          <div className="self-end">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Load</button>
          </div>
        </form>
      </Card>
      {sectionId && students.length > 0 && !readOnly && (
        <Card title="Mark attendance" subtitle={`${students.length} students · ${day}`}>
          <AttendanceForm date={day} sectionId={sectionId} students={students} existing={existing} />
        </Card>
      )}
      {sectionId && students.length === 0 && <Card title="No students">This class has no active students.</Card>}
      {readOnly && sectionId && (
        <Card title="Attendance (read only)">
          <ul className="divide-y text-sm">
            {students.map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span>{s.name}</span>
                <span className="font-bold capitalize">{existing[s.id] || "—"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Shell>
  );
}
