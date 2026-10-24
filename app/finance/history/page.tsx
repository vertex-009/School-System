import { Shell } from "@/components/shell";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { CollectionHistoryClient, type InvoiceRow } from "./collection-history-client";

export default async function CollectionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const period = parsePeriod(sp);

  const [{ data: invoices }, { data: payments }, { data: school }] = await Promise.all([
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
    supabase
      .from("schools")
      .select("name, address, phone")
      .eq("id", schoolId)
      .maybeSingle(),
  ]);

  const rows = (invoices || []) as unknown as InvoiceRow[];

  const paymentsMap: Record<string, { id: string; paid_at: string }> = {};
  for (const p of payments || []) {
    if (p.invoice_id && !paymentsMap[p.invoice_id]) {
      paymentsMap[p.invoice_id] = { id: p.id, paid_at: String(p.paid_at) };
    }
  }

  const unpaid = rows.filter((r) => r.status === "unpaid" || r.status === "partial");
  const paid = rows.filter((r) => r.status === "paid");

  return (
    <Shell role="finance" title="Collection history">
      <CollectionHistoryClient
        period={period}
        rows={rows}
        paid={paid}
        unpaid={unpaid}
        paymentsMap={paymentsMap}
        school={school}
        financeName={profile.name?.trim() || "Finance"}
      />
    </Shell>
  );
}
