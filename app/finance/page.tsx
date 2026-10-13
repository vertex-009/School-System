import Link from "next/link";
import { GenerateInvoicesCard } from "@/components/generate-invoices-card";
import { Shell } from "@/components/shell";
import { BarChartCard, RingCard, StatTiles } from "@/components/dashboard-charts";
import { MONTHS, pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

type FinanceDash = {
  month: number;
  year: number;
  paid: number;
  unpaid: number;
  students: number;
  collected: number;
  expenses: number;
};

const ACTIONS = [
  { href: "/finance/students/new", title: "Add student", desc: "Register a student with CNIC and class." },
  {
    href: "/finance/students/import",
    title: "Import by class",
    desc: "Tick a class, browse Excel (Add Student format), import roster.",
  },
  { href: "/finance/students/transfer", title: "Class transfer", desc: "Move a whole class to the next class." },
  { href: "/finance/students/school-transfer", title: "School transfer", desc: "Transfer one student to another school." },
  { href: "/finance/fees", title: "Set class fees", desc: "Set monthly fee for each class." },
  { href: "/finance/employees", title: "Other employees · Set", desc: "Add driver, peon, guard — set salary." },
  { href: "/finance/employees/pay", title: "Other employees · Pay", desc: "Pay other staff for a month & year." },
  { href: "/finance/salaries", title: "Staff · Set salary", desc: "Define monthly salary for teachers / finance." },
  { href: "/finance/salaries/pay", title: "Staff · Pay salary", desc: "Pay teachers / finance for a month & year." },
  { href: "/finance/collect", title: "Collect cash", desc: "Receive student fee payments." },
  { href: "/finance/expenses", title: "Add expense", desc: "School expenses for this month." },
  { href: "/finance/students", title: "All students", desc: "Search and manage student records." },
];

export default async function FinanceHome() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  // No invoice generation on dashboard load — use Generate invoices card only.
  const { data, error } = await supabase.rpc("get_finance_dashboard");
  if (error) {
    throw new Error(
      `${error.message} — If function missing, run supabase/migration_dashboard_perf.sql then migration_expenses_and_paid_unpaid.sql`
    );
  }
  const d = data as FinanceDash;

  const month = d.month;
  const year = d.year;
  const collected = Number(d.collected || 0);
  const expenses = Number(d.expenses || 0);
  const totalInv = (d.paid || 0) + (d.unpaid || 0);
  const paidPct = totalInv > 0 ? Math.round(((d.paid || 0) / totalInv) * 100) : 0;

  return (
    <Shell role="finance" title="Dashboard">
      <StatTiles
        items={[
          { label: "Paid", value: d.paid || 0, href: "/finance/fee-records?tab=paid", tone: "emerald" },
          { label: "Unpaid", value: d.unpaid || 0, href: "/finance/fee-records?tab=unpaid", tone: "amber" },
          { label: "Expenses", value: pkr(expenses), href: "/finance/expenses", tone: "rose" },
          { label: `${MONTHS[month - 1]} collected`, value: pkr(collected), href: "/finance/fees/monthly", tone: "navy" },
        ]}
      />

      <div className="mt-4">
        <GenerateInvoicesCard />
      </div>

      <section className="mt-4">
        <h2 className="mb-3 text-sm font-bold text-brand-navy">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-sky hover:shadow-sm"
            >
              <p className="text-sm font-bold text-brand-navy">{a.title}</p>
              <p className="mt-1 text-xs text-slate-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <RingCard title="Paid invoices" percent={paidPct} center={`${paidPct}%`} footnote={`${MONTHS[month - 1]} ${year}`} color="#059669" />
        <BarChartCard
          title="Fees"
          items={[
            { label: "Paid", value: d.paid || 0, color: "#059669" },
            { label: "Unpaid", value: d.unpaid || 0, color: "#d97706" },
          ]}
        />
        <BarChartCard
          title="This month"
          items={[
            { label: "Collected (PKR)", value: Math.round(collected), color: "#5dade2" },
            { label: "Expenses (PKR)", value: Math.round(expenses), color: "#e11d48" },
          ]}
        />
      </div>
    </Shell>
  );
}
