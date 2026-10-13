import { saveExam } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Select, Submit } from "@/components/ui";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ExamsPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  const [{ data: classes }, { data: exams }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("school_id", schoolId).order("sort_order"),
    supabase.from("exams").select("id, name, kind, exam_date, classes(name)").eq("school_id", schoolId).order("exam_date", { ascending: false }),
  ]);
  return (
    <Shell role="principal" title="Exams">
      {!readOnly && (
        <Card title="Create exam" subtitle="Lite uses Test and Final only.">
          <form action={saveExam} className="grid gap-3 md:grid-cols-4">
            <Select label="Class" name="class_id" required>{(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Field label="Name" name="name" required placeholder="Mid Test 1" />
            <Select label="Kind" name="kind" required><option value="test">Test</option><option value="final">Final</option></Select>
            <Field label="Date" name="exam_date" type="date" />
            <div className="md:col-span-4"><Submit>Create exam</Submit></div>
          </form>
        </Card>
      )}
      <Card title="Exams" subtitle={`${(exams || []).length} exams`}>
        <ul className="divide-y">{(exams || []).map((e) => (
          <li key={e.id} className="flex justify-between py-3 text-sm">
            <span><b>{e.name}</b> · {(e.classes as any)?.name} · <span className="capitalize">{e.kind}</span></span>
            <span className="text-slate-500">{e.exam_date || "—"}</span>
          </li>
        ))}</ul>
      </Card>
    </Shell>
  );
}
