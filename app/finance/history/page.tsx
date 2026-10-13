import Link from "next/link";
import { Shell } from "@/components/shell";
import { NoHistory, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { classNameOf } from "@/lib/class-label";
import { pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CollectionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const period = parsePeriod(sp);

  const [{ data: invoices }, { data: payments }] = await Promise.all([
    supabase
      .from("fee_invoices")
      .select(
        "id, student_id, amount, discount, paid_amount, status, month, year, students(id, name, admission_no, roll_no, sections(name, classes(name)))"
      )
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, invoice_id, paid_at, fee_invoices!inner(month, year)")
      .eq("school_id", schoolId)
      .eq("fee_invoices.month", period.month)
      .eq("fee_invoices.year", period.year)
      .order("paid_at", { ascending: false }),
  ]);

  const rows = invoices || [];
  /** Latest payment per invoice (for print receipt). */
  const paymentByInvoice = new Map<string, string>();
  for (const p of payments || []) {
    if (p.invoice_id && !paymentByInvoice.has(p.invoice_id)) {
      paymentByInvoice.set(p.invoice_id, p.id);
    }
  }

  return (
    <Shell role="finance" title="Collection history">
      <PeriodFilter period={period} title="Month" />

      <Card title="Invoices" subtitle={rows.length ? `${rows.length} invoices · ${period.label}` : undefined}>
        {!rows.length ? (
          <NoHistory period={period} what="fee invoices" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-slate-500">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Roll</th>
                  <th className="py-2 pr-2">Admission</th>
                  <th className="py-2 pr-2">Class</th>
                  <th className="py-2 pr-2">Month</th>
                  <th className="py-2 pr-2">Fee</th>
                  <th className="py-2 pr-2">Paid</th>
                  <th className="py-2 pr-2">Unpaid</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2">Print</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => {
                  const s = inv.students as {
                    name?: string;
                    admission_no?: string;
                    roll_no?: number | null;
                    sections?: unknown;
                  } | null;
                  const fee = Number(inv.amount) - Number(inv.discount || 0);
                  const paid = Number(inv.paid_amount || 0);
                  const unpaid = Math.max(fee - paid, 0);
                  const statusLabel = inv.status === "paid" ? "Paid" : "Unpaid";
                  const paymentId = paymentByInvoice.get(inv.id);
                  return (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2 pr-2 font-bold">{s?.name || "—"}</td>
                      <td className="py-2 pr-2">{s?.roll_no ?? "—"}</td>
                      <td className="py-2 pr-2">{s?.admission_no || "—"}</td>
                      <td className="py-2 pr-2">{classNameOf(s?.sections)}</td>
                      <td className="py-2 pr-2 whitespace-nowrap">{period.label}</td>
                      <td className="py-2 pr-2">{pkr(fee)}</td>
                      <td className="py-2 pr-2 text-emerald-700">{pkr(paid)}</td>
                      <td className="py-2 pr-2 text-rose-700">{pkr(unpaid)}</td>
                      <td className="py-2 pr-2">{statusLabel}</td>
                      <td className="py-2">
                        {paymentId ? (
                          <Link
                            href={`/finance/fees/receipts/${paymentId}`}
                            target="_blank"
                            className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-accent"
                          >
                            Print
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}
