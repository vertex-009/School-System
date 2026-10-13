import { PrintButton } from "@/components/print-button";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ResultsPrintPage({ searchParams }: { searchParams: Promise<{ exam_id?: string }> }) {
  const { exam_id } = await searchParams;
  const { supabase, schoolId } = await getContext();
  if (!schoolId || !exam_id) redirect("/principal/results");
  const [{ data: exam }, { data: school }, { data: marks }] = await Promise.all([
    supabase.from("exams").select("name, kind, exam_date, classes(name)").eq("id", exam_id).maybeSingle(),
    supabase.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    supabase.from("marks").select("student_id, obtained, total, students(name, admission_no, roll_no), subjects(name)").eq("exam_id", exam_id),
  ]);
  const byStudent = new Map<string, { name: string; admission: string; roll: number | null; obtained: number; total: number }>();
  for (const row of marks || []) {
    const s = row.students as any;
    const cur = byStudent.get(row.student_id) || { name: s?.name || "—", admission: s?.admission_no || "", roll: s?.roll_no ?? null, obtained: 0, total: 0 };
    cur.obtained += Number(row.obtained); cur.total += Number(row.total);
    byStudent.set(row.student_id, cur);
  }
  const list = [...byStudent.values()].sort((a, b) => (a.roll ?? 999) - (b.roll ?? 999));
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-slate-900">
      <h1 className="text-2xl font-bold">{school?.name}</h1>
      <p className="mt-1 text-sm text-slate-600">{exam?.name} · {(exam?.classes as any)?.name} · {exam?.kind} · {exam?.exam_date || ""}</p>
      <table className="mt-6 w-full border-collapse text-sm">
        <thead><tr className="border-b text-left"><th className="py-2">Roll</th><th>Name</th><th>Admission</th><th>Marks</th><th>%</th></tr></thead>
        <tbody>{list.map((s) => (
          <tr key={s.admission} className="border-b"><td className="py-2">{s.roll ?? "—"}</td><td>{s.name}</td><td>{s.admission}</td><td>{s.obtained}/{s.total}</td><td>{s.total ? Math.round((s.obtained / s.total) * 100) : 0}%</td></tr>
        ))}</tbody>
      </table>
      <PrintButton />
    </div>
  );
}
