import Link from "next/link";
import { GenerateInvoicesCard } from "@/components/generate-invoices-card";
import { Shell } from "@/components/shell";
import { MonthSearch } from "@/components/month-search";
import { SchoolHeroBanner } from "@/components/school-hero-banner";
import { BarChartCard, RingCard, StatTiles } from "@/components/dashboard-charts";
import { MONTHS, pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
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

const ACTIONS: {
  href: string;
  title: string;
  icon: "user" | "import" | "transfer" | "school" | "fees" | "cash" | "history" | "receipt" | "month" | "staff" | "expense" | "announce";
}[] = [
  { href: "/finance/students/new", title: "Add student", icon: "user" },
  { href: "/finance/students/import", title: "Import by class", icon: "import" },
  { href: "/finance/students/transfer", title: "Class transfer", icon: "transfer" },
  { href: "/finance/collect", title: "Collect cash", icon: "cash" },
  { href: "/finance/history", title: "Collection history", icon: "history" },
  { href: "/finance/other-employees", title: "Other employees", icon: "staff" },
  { href: "/finance/salaries", title: "Pay salaries", icon: "staff" },
  { href: "/finance/expenses", title: "Other expenses", icon: "expense" },
  { href: "/finance/announcements", title: "Announcements", icon: "announce" },
];

function ActionIcon({ kind }: { kind: (typeof ACTIONS)[number]["icon"] }) {
  const c = "h-5 w-5";
  switch (kind) {
    case "import":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M12 3v12M8 11l4 4 4-4M5 19h14" />
        </svg>
      );
    case "transfer":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M7 7h11l-3-3M17 17H6l3 3" />
        </svg>
      );
    case "school":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M3 10l9-6 9 6v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z" />
          <path d="M9 19v-6h6v6" />
        </svg>
      );
    case "fees":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      );
    case "cash":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "history":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "receipt":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5V3z" />
        </svg>
      );
    case "month":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case "staff":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
          <circle cx="17" cy="9" r="2.2" />
        </svg>
      );
    case "expense":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M16 14.5h2" />
        </svg>
      );
    case "announce":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 10v4h3l5 4V6L7 10H4zM16 9a4 4 0 0 1 0 6M18.5 7a7 7 0 0 1 0 10" />
        </svg>
      );
    case "user":
    default:
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
      );
  }
}

export default async function FinanceHome({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  if (!period.isFuture) {
    const { ensureCurrentMonthInvoices } = await import("@/lib/fee-invoices");
    await ensureCurrentMonthInvoices(supabase, { month: period.month, year: period.year, dueDay: 10 });
  }

  const [{ data, error }, { data: mySalaryRow }, { data: myPaymentRow }] = await Promise.all([
    supabase.rpc("get_finance_dashboard"),
    supabase
      .from("teacher_salaries")
      .select("monthly_salary")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .maybeSingle(),
    supabase
      .from("salary_payments")
      .select("id, amount, receipt_no, paid_at, method")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .eq("month", period.month)
      .eq("year", period.year)
      .maybeSingle(),
  ]);

  if (error) {
    throw new Error(
      `${error.message} — If function missing, run supabase/migration_dashboard_perf.sql then migration_expenses_and_paid_unpaid.sql`
    );
  }
  const d = data as FinanceDash;

  const month = d.month || period.month;
  const year = d.year || period.year;
  const dashPeriod = parsePeriod({ month, year });
  const periodLabel = dashPeriod.label;
  const collected = Number(d.collected || 0);
  const expenses = Number(d.expenses || 0);
  const paid = d.paid || 0;
  const unpaid = d.unpaid || 0;
  const totalInv = paid + unpaid;
  const paidPct = totalInv > 0 ? Math.round((paid / totalInv) * 100) : 0;

  const myMonthlySalary = Number(mySalaryRow?.monthly_salary || 0);
  const myIsPaid = Boolean(myPaymentRow);

  return (
    <Shell
      role="finance"
      title="Finance"
      headingActions={
        <MonthSearch
          period={dashPeriod}
          photoUrl={profile.photo_url}
          name={profile.name}
          basePath="/finance"
          roleLabel="Finance Admin"
        />
      }
    >
      <SchoolHeroBanner />

      <div className="mt-3">
        <StatTiles
          items={[
            {
              label: "Paid",
              value: paid,
              href: "/finance/fee-records?tab=paid",
              tone: "sky",
              icon: "invoice-paid",
            },
            {
              label: "Unpaid",
              value: unpaid,
              href: "/finance/fee-records?tab=unpaid",
              tone: "rose",
              icon: "invoice-unpaid",
            },
            {
              label: "Other expenses",
              value: pkr(expenses),
              href: "/finance/expenses",
              tone: "amber",
              icon: "wallet",
            },
            {
              label: "Fee collected",
              value: pkr(collected),
              href: "/finance/history",
              tone: "emerald",
              icon: "coins",
            },
          ]}
        />
      </div>

      <div className="mt-4">
        <GenerateInvoicesCard />
      </div>

      {/* Finance Staff Self Salary Status Card */}
      <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                myIsPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-brand-navy">My Salary Status</h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  {periodLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Salary: <b className="text-slate-800 tabular-nums">{pkr(myMonthlySalary)}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {myIsPaid ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Paid · {pkr(Number(myPaymentRow?.amount || myMonthlySalary))}
                </span>
                <Link
                  href={`/finance/salaries/receipt/${myPaymentRow?.id}`}
                  target="_blank"
                  className="rounded-xl bg-brand-navy px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-accent transition shadow-xs"
                >
                  Print Receipt →
                </Link>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Unpaid · Awaiting Principal Disbursement
              </span>
            )}
          </div>
        </div>
        {myIsPaid && myPaymentRow?.paid_at && (
          <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            <span>Disbursed on {new Date(myPaymentRow.paid_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <section className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M13 2L4 14h7l-1 8 10-14h-7l1-6z" />
            </svg>
          </span>
          <h2 className="text-sm font-bold text-[#0b1f3a]">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition hover:border-sky-200 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f2fb] text-[#3b9fd9]">
                <ActionIcon kind={a.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0b1f3a]">{a.title}</p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#3b9fd9]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-3">
        <section className="flex min-h-[17rem] lg:min-h-[18.5rem] flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
          <h2 className="text-sm font-bold text-[#0b1f3a]">Paid invoices</h2>
          <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-around">
            <RingCard percent={paidPct} center={`${paidPct}%`} color="#34d399" />
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-500">Paid</span>
                <span className="font-bold text-[#0b1f3a]">{paid}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                <span className="text-slate-500">Unpaid</span>
                <span className="font-bold text-[#0b1f3a]">{unpaid}</span>
              </li>
            </ul>
          </div>
        </section>

        <BarChartCard
          title="Fees"
          subtitle={periodLabel}
          items={[
            {
              label: "Paid",
              value: paid,
              color: "#34d399",
              showBar: true,
              scaleMax: Math.max(1, totalInv),
            },
            {
              label: "Unpaid",
              value: unpaid,
              color: "#7dd3fc",
              showBar: true,
              scaleMax: Math.max(1, totalInv),
            },
          ]}
        />

        <BarChartCard
          title="This month"
          subtitle={periodLabel}
          items={[
            {
              label: "Collected (PKR)",
              value: Math.round(collected),
              color: "#0b1f3a",
              showBar: true,
              scaleGroup: "money",
            },
            {
              label: "Other expenses (PKR)",
              value: Math.round(expenses),
              color: "#e35d6a",
              showBar: true,
              scaleGroup: "money",
            },
          ]}
        />
      </div>
    </Shell>
  );
}
