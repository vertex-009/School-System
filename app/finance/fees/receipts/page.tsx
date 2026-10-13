import { removePayment } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReceiptsPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, amount, method, receipt_no, paid_at, fee_invoices(students(name, father_name, roll_no, sections(name, classes(name))))"
    )
    .eq("school_id", schoolId)
    .order("paid_at", { ascending: false })
    .limit(100);
  return (
    <Shell role="finance" title="Receipts">
      <Card title="Recent receipts">
        <ul className="divide-y">{(payments || []).map((p) => {
          const inv = p.fee_invoices as {
            students?: {
              name?: string;
              father_name?: string;
              roll_no?: number | null;
              sections?: { name?: string; classes?: { name?: string } | null } | null;
            } | null;
          } | null;
          const student = inv?.students;
          const klass = student?.sections?.classes?.name || "—";
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <b>{student?.name || "—"}</b>
                <p className="text-xs text-slate-500">
                  {student?.father_name ? `S/O ${student.father_name} · ` : ""}
                  Class {klass}
                  {student?.roll_no != null ? ` · Roll ${student.roll_no}` : ""}
                  {" · "}
                  {p.receipt_no} · {String(p.method).replace(/_/g, " ")} ·{" "}
                  {new Date(p.paid_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <b>{pkr(p.amount)}</b>
                <Link href={`/finance/fees/receipts/${p.id}`} className="text-xs font-bold text-blue-600">Print</Link>
                {true && <form action={removePayment.bind(null, p.id)}><button className="text-xs font-bold text-rose-600">Delete</button></form>}
              </div>
            </li>
          );
        })}</ul>
      </Card>
    </Shell>
  );
}
