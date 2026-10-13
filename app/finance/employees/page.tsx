import { saveOtherEmployee, setOtherEmployeeActive } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { formatCnic } from "@/lib/cnic";
import { pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { OtherEmployeeForm } from "./form";

export default async function OtherEmployeesSetPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { data: employees, error } = await supabase
    .from("other_employees")
    .select("id, name, job_title, phone, cnic, monthly_salary, is_active, joined_on, left_on, created_at")
    .eq("school_id", schoolId)
    .order("name");

  const list = error ? [] : employees || [];

  return (
    <Shell role="finance" title="Set salary">
      <p className="text-sm text-slate-600">
        Drivers, peons, guards — add / set salary here. Pay and history are under Other employees in the sidebar.
      </p>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Run <code className="font-mono text-xs">migration_other_employees.sql</code> in Supabase if this table is missing.
        </div>
      )}

      <OtherEmployeeForm />

      <Card title="Employees" subtitle={`${list.length} record(s)`}>
        {!list.length ? (
          <p className="text-sm text-slate-500">No other employees yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <b className="text-brand-navy">{e.name}</b>
                  <p className="text-xs text-slate-500">
                    {e.job_title}
                    {e.phone ? ` · ${e.phone}` : ""}
                    {e.cnic ? ` · ${formatCnic(e.cnic)}` : ""}
                    {" · "}
                    {e.is_active ? "Active" : "Inactive"}
                    {e.joined_on ? ` · Joined ${e.joined_on}` : ""}
                    {e.left_on ? ` · Left ${e.left_on}` : ""}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-600">{pkr(e.monthly_salary)} / month</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <form
                    action={async (fd) => {
                      "use server";
                      fd.set("id", e.id);
                      await saveOtherEmployee(fd);
                    }}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <label className="text-xs font-bold text-slate-600">
                      Salary
                      <input
                        name="monthly_salary"
                        type="number"
                        min={0}
                        defaultValue={Number(e.monthly_salary)}
                        required
                        className="mt-1 w-28 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <input type="hidden" name="name" value={e.name} />
                    <input type="hidden" name="job_title" value={e.job_title} />
                    <input type="hidden" name="phone" value={e.phone || ""} />
                    <input type="hidden" name="cnic" value={e.cnic || ""} />
                    <input type="hidden" name="joined_on" value={e.joined_on || ""} />
                    <button className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white hover:bg-brand-accent">
                      Save
                    </button>
                  </form>
                  <form action={setOtherEmployeeActive.bind(null, e.id, !e.is_active)}>
                    <button
                      className={`rounded-xl px-3 py-2 text-xs font-bold ${
                        e.is_active ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {e.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
