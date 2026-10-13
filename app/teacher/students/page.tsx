import { ClassChipBar } from "@/components/class-chip-bar";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ section_id?: string }>;
}) {
  const { section_id } = await searchParams;
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const classes = await getTeacherClasses(supabase, schoolId, profile.id);
  const sectionId = section_id && classes.some((c) => c.sectionId === section_id) ? section_id : classes[0]?.sectionId || "";
  const active = classes.find((c) => c.sectionId === sectionId);

  const { data: students } = sectionId
    ? await supabase
        .from("students")
        .select("id, name, admission_no, roll_no, father_name, guardian_phone, gender, status")
        .eq("section_id", sectionId)
        .eq("school_id", schoolId)
        .eq("status", "active")
        .order("roll_no", { ascending: true, nullsFirst: false })
        .order("name")
    : { data: [] };

  const list = students || [];

  return (
    <Shell role="teacher" title="Students">
      <Card title="Your classes" subtitle="From Principal assign + timetable">
        <ClassChipBar classes={classes} activeSectionId={sectionId} basePath="/teacher/students" />
      </Card>

      {sectionId && (
        <Card title={active?.label || "Roster"} subtitle={`${list.length} students · row view`}>
          {!list.length ? (
            <p className="text-sm text-slate-500">No active students in this class.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2.5 pr-3 font-semibold">Roll</th>
                    <th className="py-2.5 pr-3 font-semibold">Name</th>
                    <th className="py-2.5 pr-3 font-semibold">Father</th>
                    <th className="py-2.5 pr-3 font-semibold">Admission</th>
                    <th className="py-2.5 pr-3 font-semibold">Phone</th>
                    <th className="py-2.5 font-semibold">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pr-3 tabular-nums text-slate-600">{s.roll_no ?? "—"}</td>
                      <td className="py-2.5 pr-3 font-bold text-brand-navy">{s.name}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{s.father_name || "—"}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{s.admission_no}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{s.guardian_phone || "—"}</td>
                      <td className="py-2.5 capitalize text-slate-600">{s.gender || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </Shell>
  );
}
