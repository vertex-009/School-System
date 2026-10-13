import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { PaySalaryForm } from "./form";

export default async function PaySalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const period = parsePeriod(sp);

  const [{ data: portalStaff }, { data: salaries }, { data: paidRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, role, joined_on, left_on, is_active")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "finance"])
      .order("name"),
    supabase.from("teacher_salaries").select("teacher_id, monthly_salary").eq("school_id", schoolId),
    supabase
      .from("salary_payments")
      .select("teacher_id, month, year")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
  ]);

  const salaryMap: Record<string, number> = Object.fromEntries(
    (salaries || []).map((s) => [s.teacher_id, Number(s.monthly_salary)])
  );

  const staff = (portalStaff || [])
    .filter((t) => t.is_active && inEmploymentWindow(t.joined_on, t.left_on, period))
    .map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      kind: "portal" as const,
    }));

  const paidKeys = (paidRows || []).map((p) => `portal:${p.teacher_id}:${p.month}:${p.year}`);

  return (
    <Shell role="finance" title="Pay salary">
      <PeriodFilter period={period} title="Salary month & year" submitLabel="Show" />

      {period.isFuture ? (
        <NoRecordFound message="Cannot pay salary for a future month." />
      ) : !staff.length ? (
        <NoRecordFound message={`No payable staff for ${period.label}.`} />
      ) : (
        <PaySalaryForm
          staff={staff}
          salaryMap={salaryMap}
          paidKeys={paidKeys}
          month={period.month}
          year={period.year}
          periodLabel={period.label}
        />
      )}
    </Shell>
  );
}
