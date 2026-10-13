import Link from "next/link";
import { Shell } from "@/components/shell";
import { BarChartCard, ColumnChartCard, DashIntro, RingCard, StatTiles } from "@/components/dashboard-charts";
import { MONTHS, pkr } from "@/lib/format";
import { SCHOOL } from "@/lib/brand";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

type PrincipalDash = {
  month: number;
  year: number;
  students: number;
  teachers: number;
  exams: number;
  marks: number;
  announcements: number;
  paid: number;
  unpaid: number;
  left_students: number;
  classes: number;
  collected: number;
  billed: number;
  paid_on_invoices: number;
  expenses: number;
};

export default async function PrincipalHome() {
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");

  const { data, error } = await supabase.rpc("get_principal_dashboard");
  if (error) {
    throw new Error(
      `${error.message} — If function missing, run supabase/migration_dashboard_perf.sql then migration_expenses_and_paid_unpaid.sql`
    );
  }
  const d = data as PrincipalDash;

  const month = d.month;
  const year = d.year;
  const periodLabel = `${MONTHS[month - 1]} ${year}`;
  const collected = Number(d.collected || 0);
  const billed = Number(d.billed || 0);
  const paidOnInvoices = Number(d.paid_on_invoices || 0);
  const expenses = Number(d.expenses || 0);
  const collectionPct = billed > 0 ? Math.round((paidOnInvoices / billed) * 100) : 0;

  return (
    <Shell role="principal" title="Dashboard">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <DashIntro title={`${SCHOOL.name}`} detail={`Principal dashboard · ${periodLabel}`} />
        <Link
          href="/principal/account"
          className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent"
        >
          Monthly account →
        </Link>
      </div>

      <StatTiles
        items={[
          {
            label: "Paid invoices",
            value: d.paid || 0,
            href: "/principal/fees/overview",
            tone: "emerald",
            hint: periodLabel,
          },
          {
            label: "Unpaid invoices",
            value: d.unpaid || 0,
            href: "/principal/fees/overview",
            tone: "amber",
            hint: periodLabel,
          },
          {
            label: "Expenses",
            value: pkr(expenses),
            href: "/principal/account",
            tone: "rose",
            hint: periodLabel,
          },
          {
            label: "Fee collected",
            value: pkr(collected),
            href: "/principal/account",
            tone: "navy",
            hint: periodLabel,
          },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <RingCard
          title="Collection rate"
          percent={collectionPct}
          center={`${collectionPct}%`}
          footnote={`Billed vs paid · ${periodLabel}`}
          color="#0b1f3a"
        />
        <ColumnChartCard
          title="School overview"
          subtitle="Current roll"
          items={[
            { label: "Students", value: d.students || 0, color: "#0b1f3a" },
            { label: "Teachers", value: d.teachers || 0, color: "#1a5276" },
            { label: "Classes", value: d.classes || 0, color: "#5dade2" },
            { label: "Left", value: d.left_students || 0, color: "#94a3b8" },
          ]}
        />
        <BarChartCard
          title="This month"
          subtitle={periodLabel}
          items={[
            { label: "Paid", value: d.paid || 0, color: "#059669" },
            { label: "Unpaid", value: d.unpaid || 0, color: "#d97706" },
            { label: "Expenses", value: Math.round(expenses), color: "#e11d48" },
            { label: "Collected", value: Math.round(collected), color: "#5dade2" },
          ]}
        />
      </div>
    </Shell>
  );
}
