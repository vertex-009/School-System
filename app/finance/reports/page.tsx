import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

const REPORTS = [
  { href: "/finance/fee-records?tab=paid", title: "Paid", desc: "Paid fee invoices" },
  { href: "/finance/fee-records?tab=unpaid", title: "Unpaid", desc: "Unpaid fee invoices" },
  { href: "/finance/fees/receipts", title: "Fee receipts", desc: "All collection receipts" },
  { href: "/finance/fees/monthly", title: "Monthly fee collection", desc: "Collection totals by month" },
  { href: "/finance/salaries/status", title: "Staff salary history", desc: "Teachers / finance by month" },
  { href: "/finance/employees/history", title: "Other employees history", desc: "Driver / peon pay by month" },
  { href: "/finance/expenses", title: "School expenses", desc: "Expense register" },
  { href: "/finance/expenses/other", title: "Other payments", desc: "Misc payments list" },
  { href: "/finance/income-vs-expenses", title: "Income vs expenses", desc: "Monthly P&L view" },
  { href: "/finance/fees", title: "Class fee structure", desc: "Monthly fee by class" },
  { href: "/finance/students", title: "Students", desc: "Admission directory" },
];

export default async function FinanceReportsPage() {
  const { profile } = await getContext();
  if (profile.role !== "finance") redirect("/");
  return (
    <Shell role="finance" title="Financial reports">
      <Card title="All finance reports" subtitle="Frontend links — Finance / Accounts Person">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((r) => (
            <Link key={r.href} href={r.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
              <p className="font-bold text-slate-900">{r.title}</p>
              <p className="mt-1 text-xs text-slate-500">{r.desc}</p>
            </Link>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
