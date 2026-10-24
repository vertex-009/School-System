import { Shell } from "@/components/shell";
import { MonthSearch } from "@/components/month-search";
import { SchoolHeroBanner } from "@/components/school-hero-banner";
import { BarChartCard, ColumnChartCard, RingCard, StatTiles } from "@/components/dashboard-charts";
import { pkr } from "@/lib/format";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

type DashNums = {
  students: number;
  teachers: number;
  left_students: number;
  classes: number;
  paid: number;
  unpaid: number;
  collected: number;
  billed: number;
  paid_on_invoices: number;
  expenses: number;
};

async function loadPrincipalDash(
  supabase: Awaited<ReturnType<typeof getContext>>["supabase"],
  schoolId: string,
  month: number,
  year: number
): Promise<DashNums> {
  const { monthStart, monthEnd, dayStart, dayEnd } = periodBounds(month, year);

  const [
    { count: students },
    { count: teachers },
    { count: left_students },
    { count: classes },
    { count: paid },
    { count: unpaid },
    { data: payRows },
    { data: invRows },
    { data: expRows },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .eq("is_active", true),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "left"),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase
      .from("fee_invoices")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("month", month)
      .eq("year", year)
      .eq("status", "paid"),
    supabase
      .from("fee_invoices")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("month", month)
      .eq("year", year)
      .in("status", ["unpaid", "partial"]),
    supabase
      .from("payments")
      .select("amount")
      .eq("school_id", schoolId)
      .gte("paid_at", monthStart)
      .lt("paid_at", monthEnd),
    supabase
      .from("fee_invoices")
      .select("amount, discount, paid_amount")
      .eq("school_id", schoolId)
      .eq("month", month)
      .eq("year", year),
    supabase
      .from("school_expenses")
      .select("amount")
      .eq("school_id", schoolId)
      .gte("expense_date", dayStart)
      .lt("expense_date", dayEnd),
  ]);

  const collected = (payRows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  const billed = (invRows || []).reduce(
    (s, r) => s + Number(r.amount || 0) - Number(r.discount || 0),
    0
  );
  const paid_on_invoices = (invRows || []).reduce((s, r) => s + Number(r.paid_amount || 0), 0);
  const expenses = (expRows || []).reduce((s, r) => s + Number(r.amount || 0), 0);

  return {
    students: students || 0,
    teachers: teachers || 0,
    left_students: left_students || 0,
    classes: classes || 0,
    paid: paid || 0,
    unpaid: unpaid || 0,
    collected,
    billed,
    paid_on_invoices,
    expenses,
  };
}

export default async function PrincipalHome({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (!schoolId) redirect("/");

  const d = await loadPrincipalDash(supabase, schoolId, period.month, period.year);
  const periodLabel = period.label;
  const collected = d.collected;
  const billed = d.billed;
  const expenses = d.expenses;
  const collectionPct = billed > 0 ? Math.round((d.paid_on_invoices / billed) * 100) : 0;

  return (
    <Shell
      role="principal"
      title="Dashboard"
      headingActions={
        <MonthSearch period={period} photoUrl={profile.photo_url} name={profile.name} />
      }
    >
      <SchoolHeroBanner />

      <StatTiles
        items={[
          {
            label: "Paid invoices",
            value: d.paid,
            href: "/principal/fees/overview",
            tone: "sky",
            hint: periodLabel,
            icon: "invoice-paid",
          },
          {
            label: "Unpaid invoices",
            value: d.unpaid,
            href: "/principal/fees/overview",
            tone: "rose",
            hint: periodLabel,
            icon: "invoice-unpaid",
          },
          {
            label: "Expenses",
            value: pkr(expenses),
            href: "/principal/account",
            tone: "amber",
            hint: periodLabel,
            icon: "wallet",
          },
          {
            label: "Fee collected",
            value: pkr(collected),
            href: "/principal/account",
            tone: "emerald",
            hint: periodLabel,
            icon: "coins",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-3">
        <section className="relative flex min-h-[17rem] lg:min-h-[18.5rem] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1f3a] via-[#0d2744] to-[#071528] p-4 text-white shadow-[0_2px_14px_rgba(7,21,40,0.25)]">
          {/* Graduation / book watermark */}
          <div className="pointer-events-none absolute bottom-2 left-3 text-sky-300/20" aria-hidden>
            <svg width="88" height="64" viewBox="0 0 88 64" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M18 38c0-8 8-14 18-14s18 6 18 14" />
              <circle cx="36" cy="18" r="8" />
              <path d="M52 28h28v24H52V28z" />
              <path d="M56 34h20M56 40h14" />
              <path d="M10 48h52l-6 10H16l-6-10z" opacity="0.7" />
            </svg>
          </div>
          <div className="relative z-[1] mb-1 flex shrink-0 items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#5dade2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="4" y="12" width="3.5" height="8" rx="1" />
                <rect x="10.25" y="7" width="3.5" height="13" rx="1" />
                <rect x="16.5" y="3" width="3.5" height="17" rx="1" />
              </svg>
              <h2 className="text-sm font-bold">Collection rate</h2>
            </div>
            <p className="text-[11px] font-medium text-white/55">{periodLabel}</p>
          </div>
          <div className="relative z-[1] flex min-h-0 flex-1 items-center justify-center">
            <RingCard
              percent={collectionPct}
              center={`${collectionPct}%`}
              footnote="Billed vs paid"
              period={periodLabel}
              color="#5dade2"
              dark
            />
          </div>
        </section>
        <ColumnChartCard
          title="School overview"
          subtitle="Current roll"
          items={[
            {
              label: "Students",
              value: d.students,
              color: "#0b1f3a",
              quickLinks: [
                { label: "Add student", href: "/principal/students/new", icon: "➕", hint: "Admit new student" },
                { label: "Student directory", href: "/principal/students", icon: "📋", hint: "Search & view roster" },
              ],
            },
            {
              label: "Teachers",
              value: d.teachers,
              color: "#2a6f97",
              quickLinks: [
                {
                  label: "Pending",
                  href: `/principal/salaries?type=teachers&status=pending&month=${period.month}&year=${period.year}`,
                  icon: "⏳",
                  hint: "Pending faculty disbursals",
                },
                {
                  label: "Paid",
                  href: `/principal/salaries?type=teachers&status=paid&month=${period.month}&year=${period.year}`,
                  icon: "✅",
                  hint: "Cleared salary vouchers",
                },
                {
                  label: "Teacher directory",
                  href: "/principal/faculty",
                  icon: "👨‍🏫",
                  hint: "Faculty roster & profiles",
                },
              ],
            },
            { label: "Classes", value: d.classes, color: "#5dade2", href: "/principal/classes" },
            { label: "Left", value: d.left_students, color: "#d1d9e4", href: "/principal/students?status=left" },
          ]}
        />
        <BarChartCard
          title="This month"
          subtitle={periodLabel}
          items={[
            {
              label: "Paid",
              value: d.paid,
              color: "#34d399",
              showBar: true,
              scaleGroup: "invoices",
              scaleMax: Math.max(1, d.paid + d.unpaid),
            },
            {
              label: "Unpaid",
              value: d.unpaid,
              color: "#fb923c",
              showBar: true,
              scaleGroup: "invoices",
              scaleMax: Math.max(1, d.paid + d.unpaid),
            },
            {
              label: "Expenses",
              value: Math.round(expenses),
              color: "#e35d6a",
              showBar: true,
              scaleGroup: "money",
            },
            {
              label: "Collected",
              value: Math.round(collected),
              color: "linear-gradient(90deg, #7ec8f0, #5dade2)",
              showBar: true,
              scaleGroup: "money",
            },
          ]}
        />
      </div>
    </Shell>
  );
}
