import { deleteClass, saveClass, saveFee } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Submit } from "@/components/ui";
import { pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ClassesPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, fee_structure(id, monthly_fee)")
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
        {(classes || []).map((item) => {
          const feeObj = Array.isArray(item.fee_structure) ? item.fee_structure[0] : item.fee_structure;
          const feeAmount = Number(feeObj?.monthly_fee ?? 0);
          return (
            <div key={item.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm">
              <div>
                <b className="text-brand-navy">{item.name}</b>
                <p className="text-xs text-slate-500">{pkr(feeAmount)} / month</p>
              </div>
              <div className="flex items-center gap-2">
                {!readOnly && (
                  <form
                    action={async (fd) => {
                      "use server";
                      await saveFee(item.id, Number(fd.get("monthly_fee")));
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      name="monthly_fee"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={feeAmount}
                      className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-sky focus:bg-white"
                      placeholder="Fee (PKR)"
                    />
                    <button className="rounded-xl bg-brand-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-accent">
                      Save
                    </button>
                  </form>
                )}
                {!readOnly && (
                  <form action={deleteClass.bind(null, item.id)}>
                    <button className="ml-2 text-xs font-bold text-rose-600 hover:underline">Delete</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {!(classes || []).length && <p className="text-sm text-slate-500">No classes yet.</p>}
      </Card>
    </Shell>
  );
}
