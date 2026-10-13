import { saveDiscount } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card, Field, Submit } from "@/components/ui";
import { pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FeeRecordsPage({
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
    .select("id, month, year, amount, discount, discount_reason, paid_amount, status, due_date, students(name, admission_no)")
    .eq("school_id", schoolId)
    .eq("month", period.month)
    .eq("year", period.year)
    .order("created_at", { ascending: false });

  const list = invoices || [];

  return (
    <Shell role="finance" title="Fee records">
      <PeriodFilter period={period} title="Filter" submitLabel="Apply" />

      <Card title={period.label} subtitle={list.length ? `${list.length} invoices` : undefined}>
        {!list.length ? (
          <NoHistory period={period} what="fee invoices" />
        ) : (
          <ul className="divide-y">
            {list.map((inv) => {
              const student = inv.students as { name?: string; admission_no?: string } | null;
              const net = Number(inv.amount) - Number(inv.discount || 0);
              return (
                <li key={inv.id} className="py-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <b>{student?.name}</b>
                      <p className="text-xs text-slate-500">
                        {student?.admission_no} · due {inv.due_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {pkr(net)} · <span className="capitalize">{inv.status}</span>
                      </p>
                      <p className="text-xs text-slate-500">Paid {pkr(inv.paid_amount)}</p>
                    </div>
                  </div>
                  <form action={saveDiscount} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="invoice_id" value={inv.id} />
                    <Field label="Discount" name="discount" type="number" min={0} defaultValue={inv.discount || 0} />
                    <Field label="Reason" name="reason" defaultValue={inv.discount_reason || ""} />
                    <Submit>Update discount</Submit>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
