import { saveSalary } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SalariesPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const [{ data: staff }, { data: salaries }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, phone, is_active, role")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "finance"])
      .order("name"),
    supabase.from("teacher_salaries").select("teacher_id, monthly_salary").eq("school_id", schoolId),
  ]);
  const map = Object.fromEntries((salaries || []).map((s) => [s.teacher_id, s.monthly_salary]));

  return (
    <Shell role="finance" title="Set salary">
      <Card
        title="Monthly salary"
        subtitle="Set salaries for teachers and finance staff only. Pay and history are under Staff in the sidebar."
      >
        <ul className="divide-y divide-slate-100">
          {(staff || []).map((t) => {
            const amount = Number(map[t.id] || 0);
            return (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <b className="text-brand-navy">{t.name}</b>
                  <p className="text-xs capitalize text-slate-500">
                    {t.role} · {t.phone || "—"} · {t.is_active ? "Active" : "Suspended"} · {pkr(amount)} / month
                  </p>
                </div>
                <form
                  action={async (fd) => {
                    "use server";
                    await saveSalary(t.id, Number(fd.get("monthly_salary")));
                  }}
                  className="flex items-end gap-2"
                >
                  <label className="text-xs font-bold text-slate-600">
                    Salary (PKR)
                    <input
                      name="monthly_salary"
                      type="number"
                      min={0}
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
        {!staff?.length && (
          <p className="text-sm text-slate-500">No staff yet. Principal creates teacher / finance accounts.</p>
        )}
      </Card>
    </Shell>
  );
}
