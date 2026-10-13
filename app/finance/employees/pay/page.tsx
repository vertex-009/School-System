import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { inEmploymentWindow, parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { PayOtherEmployeeForm } from "./form";

export default async function PayOtherEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const period = parsePeriod(sp);

  const [{ data: otherEmp }, { data: otherPaid }] = await Promise.all([
    supabase
      .from("other_employees")
      .select("id, name, job_title, monthly_salary, joined_on, left_on, is_active")
      .eq("school_id", schoolId)
      .order("name"),
    supabase
      .from("other_salary_payments")
      .select("employee_id")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
  ]);

  const employees = (otherEmp || [])
    .filter((e) => e.is_active && inEmploymentWindow(e.joined_on, e.left_on, period))
    .map((e) => ({
      id: e.id,
      name: e.name,
      job_title: e.job_title,
      monthly_salary: Number(e.monthly_salary),
    }));

  const paidIds = (otherPaid || []).map((p) => p.employee_id);

  return (
    <Shell role="finance" title="Pay salary">
      <PeriodFilter period={period} title="Salary month & year" submitLabel="Show" />

      {period.isFuture ? (
        <NoRecordFound message="Cannot pay salary for a future month." />
      ) : !employees.length ? (
        <NoRecordFound message={`No payable employees for ${period.label}.`} />
      ) : (
        <PayOtherEmployeeForm
          employees={employees}
          paidIds={paidIds}
          month={period.month}
          year={period.year}
          periodLabel={period.label}
        />
      )}
    </Shell>
  );
}
