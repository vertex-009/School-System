import { deleteClass, saveClass } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Submit } from "@/components/ui";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ClassesPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");

  return (
    <Shell role="principal" title="Classes">
      {!readOnly && (
        <Card title="Add class" subtitle="Each class is one unit — no Section A/B.">
          <form action={saveClass} className="flex flex-wrap gap-2">
            <div className="min-w-[200px] flex-1">
              <Field label="Class name" name="name" required placeholder="e.g. Class 5" />
            </div>
            <div className="self-end">
              <Submit>Add class</Submit>
            </div>
          </form>
        </Card>
      )}
      <Card title="Classes" subtitle={`${(classes || []).length} classes`}>
        {(classes || []).map((item) => (
          <div key={item.id} className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 p-4 text-sm">
            <b className="text-brand-navy">{item.name}</b>
            {!readOnly && (
              <form action={deleteClass.bind(null, item.id)}>
                <button className="text-xs font-bold text-rose-600">Delete</button>
              </form>
            )}
          </div>
        ))}
        {!(classes || []).length && <p className="text-sm text-slate-500">No classes yet.</p>}
      </Card>
    </Shell>
  );
}
