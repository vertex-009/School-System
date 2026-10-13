import Link from "next/link";
import { Shell } from "@/components/shell";
import { NoRecordFound } from "@/components/period-filter";
import { Card, Select } from "@/components/ui";
import { primarySectionIdByClass } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; exam_id?: string }>;
}) {
  const { class: classId = "", exam_id = "" } = await searchParams;
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const [{ data: classes }, { data: sections }] = await Promise.all([
    supabase.from("classes").select("id, name, sort_order").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, class_id, name").eq("school_id", schoolId),
  ]);

  const primary = primarySectionIdByClass(sections || []);
  const classOptions = (classes || []).filter((c) => primary.has(c.id));
  const activeClassId = classId && classOptions.some((c) => c.id === classId) ? classId : "";
  const activeClassName = classOptions.find((c) => c.id === activeClassId)?.name;

  const sectionIds = activeClassId
    ? (sections || []).filter((s) => s.class_id === activeClassId).map((s) => s.id)
    : [];

  const [{ data: exams }, { data: students }] = await Promise.all([
    activeClassId
      ? supabase
          .from("exams")
          .select("id, name, kind, exam_date")
          .eq("school_id", schoolId)
          .eq("class_id", activeClassId)
          .order("exam_date", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; name: string; kind: string; exam_date: string | null }[] }),
    sectionIds.length
      ? supabase
          .from("students")
          .select("id, name, admission_no, roll_no, father_name")
          .eq("school_id", schoolId)
          .eq("status", "active")
          .in("section_id", sectionIds)
          .order("roll_no", { ascending: true, nullsFirst: false })
          .order("name")
      : Promise.resolve({ data: [] as { id: string; name: string; admission_no: string; roll_no: number | null; father_name: string | null }[] }),
  ]);

  const examList = exams || [];
  const examId = exam_id && examList.some((e) => e.id === exam_id) ? exam_id : examList[0]?.id || "";
  const activeExam = examList.find((e) => e.id === examId);

  type MarkRow = { student_id: string; obtained: number; total: number; subject_name: string };
  let marks: MarkRow[] = [];

  if (examId) {
    const { data } = await supabase
      .from("marks")
      .select("student_id, obtained, total, subjects(name)")
      .eq("exam_id", examId)
      .eq("school_id", schoolId);
    marks = (data || []).map((row: any) => {
      const sub = row.subjects;
      const subject_name = Array.isArray(sub) ? sub[0]?.name : sub?.name;
      return {
        student_id: String(row.student_id),
        obtained: Number(row.obtained),
        total: Number(row.total),
        subject_name: (subject_name as string) || "Subject",
      };
    });
  }

  const subjectNames = [...new Set(marks.map((m) => m.subject_name).filter(Boolean))];
  const byStudent = new Map<string, Map<string, { obtained: number; total: number }>>();
  for (const m of marks) {
    if (!byStudent.has(m.student_id)) byStudent.set(m.student_id, new Map());
    byStudent.get(m.student_id)!.set(m.subject_name, { obtained: m.obtained, total: m.total });
  }

  const studentRows = students || [];

  return (
    <Shell role="principal" title="Exam / results">
      <Card title="Select class">
        <div className="flex flex-wrap gap-2">
          {classOptions.map((c) => {
            const active = c.id === activeClassId;
            return (
              <Link
                key={c.id}
                href={`/principal/results?class=${c.id}`}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-brand-navy text-white shadow-sm"
                    : "border border-slate-200 bg-white text-brand-navy hover:border-brand-sky hover:bg-slate-50"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
          {!classOptions.length && <p className="text-sm text-slate-500">No classes yet.</p>}
        </div>
      </Card>

      {activeClassId && !examList.length && (
        <NoRecordFound message="No record found" />
      )}

      {activeClassId && examList.length > 0 && (
        <Card title="Exam" subtitle={activeClassName || ""}>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="class" value={activeClassId} />
            <Select label="Exam" name="exam_id" defaultValue={examId}>
              {examList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.kind ? ` · ${e.kind}` : ""}
                </option>
              ))}
            </Select>
            <button type="submit" className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white">
              Load
            </button>
            {examId && (
              <Link href={`/principal/results/print?exam_id=${examId}`} className="self-end text-xs font-bold text-brand-accent hover:underline">
                Print view →
              </Link>
            )}
          </form>
        </Card>
      )}

      {activeClassId && examId && !marks.length && (
        <NoRecordFound message="No record found" />
      )}

      {activeClassId && examId && marks.length > 0 && (
        <Card
          title="Result sheet"
          subtitle={`${activeClassName} · ${activeExam?.name || "Exam"} · ${studentRows.length} students`}
        >
          {!studentRows.length ? (
            <NoRecordFound message="No record found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Roll</th>
                    <th className="py-2 pr-3 font-semibold">Name</th>
                    <th className="py-2 pr-3 font-semibold">Father</th>
                    <th className="py-2 pr-3 font-semibold">Adm</th>
                    {subjectNames.map((s) => (
                      <th key={s} className="py-2 pr-3 font-semibold whitespace-nowrap">
                        {s}
                      </th>
                    ))}
                    <th className="py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentRows.map((st) => {
                    const subMap = byStudent.get(st.id);
                    let obt = 0;
                    let tot = 0;
                    if (subMap) {
                      for (const v of subMap.values()) {
                        obt += v.obtained;
                        tot += v.total;
                      }
                    }
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 pr-3 tabular-nums text-slate-600">{st.roll_no ?? "—"}</td>
                        <td className="py-2.5 pr-3 font-bold text-brand-navy">{st.name}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{st.father_name || "—"}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{st.admission_no}</td>
                        {subjectNames.map((s) => {
                          const m = subMap?.get(s);
                          return (
                            <td key={s} className="py-2.5 pr-3 tabular-nums text-slate-700">
                              {m ? `${m.obtained}/${m.total}` : "—"}
                            </td>
                          );
                        })}
                        <td className="py-2.5 font-bold tabular-nums">
                          {tot ? (
                            <>
                              {obt}/{tot}{" "}
                              <span className="text-xs font-semibold text-slate-500">({Math.round((obt / tot) * 100)}%)</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </Shell>
  );
}
