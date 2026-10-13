import { addSubject } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Submit } from "@/components/ui";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
export default async function SubjectsPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  const { data: subjects } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId).order("name");
  return (
    <Shell role="principal" title="Subjects">
      {!readOnly && <Card title="Add subject"><form action={addSubject} className="flex gap-2"><Field label="Name" name="name" required /><Submit>Add</Submit></form></Card>}
      <Card title="Subjects" subtitle={`${(subjects||[]).length} in this school`}><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(subjects||[]).map((s)=><li key={s.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold">{s.name}</li>)}</ul></Card>
    </Shell>
  );
}
