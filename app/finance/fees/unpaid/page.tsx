import { Shell } from "@/components/shell";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function UnpaidPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const period = parsePeriod(sp);

  const { data: invoices } = await supabase
    .from("fee_invoices")
    .select("id, month, year, amount, discount, paid_amount, status, due_date, students(name, admission_no, guardian_phone)")
    .eq("school_id", schoolId)
    .eq("month", period.month)
    .eq("year", period.year)
    .in("status", ["unpaid", "partial"])
    .order("due_date");

  const list = invoices || [];

  return (
    <Shell role="finance" title="Unpaid list">
      <PeriodFilter period={period} title="Month" />

      <Card title={`Unpaid · ${period.label}`} subtitle={list.length ? String(list.length) : undefined}>
        {!list.length ? (
          <NoHistory period={period} what="unpaid invoices" />
        ) : (
          <ul className="divide-y">
            {list.map((inv) => {
              const s = inv.students as { name?: string; admission_no?: string; guardian_phone?: string } | null;
              const due = Number(inv.amount) - Number(inv.discount || 0) - Number(inv.paid_amount || 0);
              return (
                <li key={inv.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <div>
                    <b>{s?.name}</b>
                    <p className="text-xs text-slate-500">
                      {s?.admission_no} · {s?.guardian_phone || "—"} · {period.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <b>{pkr(due)}</b>
                    <p className="text-xs text-slate-500">Unpaid</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
