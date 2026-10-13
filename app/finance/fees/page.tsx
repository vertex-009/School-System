import Link from "next/link";
import { generateInvoices, saveFee } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Select, Submit } from "@/components/ui";
import { MONTHS, pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FeesPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const now = new Date();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, fee_structure(id, monthly_fee)")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");

  return (
    <Shell role="finance" title="Set class fees">
      <Link href="/finance" className="text-xs font-bold text-brand-accent hover:underline">
        ← Dashboard
      </Link>

      <Card title="Monthly fee by class">
        {!(classes || []).length ? (
          <p className="text-sm text-slate-500">No classes yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(classes || []).map((c) => {
              const fee = Array.isArray(c.fee_structure) ? c.fee_structure[0] : c.fee_structure;
              const amount = Number(fee?.monthly_fee ?? 0);
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <b className="text-brand-navy">{c.name}</b>
                    <p className="text-xs text-slate-500">{pkr(amount)} / month</p>
                  </div>
                  <form
                    action={async (fd) => {
                      "use server";
                      await saveFee(c.id, Number(fd.get("monthly_fee")));
                    }}
                    className="flex items-end gap-2"
                  >
                    <label className="text-xs font-bold text-slate-600">
                      Amount (PKR)
                      <input
                        name="monthly_fee"
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={amount}
                        required
                        className="mt-1 w-36 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
                      />
                    </label>
                    <button className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white hover:bg-brand-accent">
                      Save
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Generate invoices">
        <form
          action={async (fd) => {
            "use server";
            const r = await generateInvoices(fd);
            if (r?.error) throw new Error(r.error);
          }}
          className="grid gap-3 sm:grid-cols-4 sm:items-end"
        >
          <Select label="Month" name="month" defaultValue={String(now.getMonth() + 1)}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
          <Field label="Year" name="year" type="number" defaultValue={now.getFullYear()} required />
          <Field label="Due day" name="due_day" type="number" min={1} max={28} defaultValue={10} required />
          <Submit>Generate</Submit>
        </form>
      </Card>
    </Shell>
  );
}
