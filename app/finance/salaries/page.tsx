import { Shell } from "@/components/shell";
import { Back } from "@/components/ui";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { PrincipalSalaryView, StaffSalaryItem } from "@/app/principal/salaries/salary-view";

export default async function FinanceSalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; type?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const period = parsePeriod(sp);
  const activeTab = (sp.type === "employees" ? "employees" : "teachers") as "teachers" | "finance" | "employees";
  const initialStatus = (
    sp.status === "paid" || sp.status === "pending" || sp.status === "all" ? sp.status : null
  ) as "all" | "pending" | "paid" | null;

  // Fetch all teacher profiles, other employees, salaries, and salary payments
  const [
    { data: staffProfiles },
    { data: teacherSalaries },
    { data: staffPayments },
    { data: otherEmployeesData },
    { data: otherPayments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, phone, joined_on, left_on, is_active")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .eq("is_active", true)
      .order("name"),
    supabase.from("teacher_salaries").select("teacher_id, monthly_salary").eq("school_id", schoolId),
    supabase
      .from("salary_payments")
      .select("id, teacher_id, amount, receipt_no, paid_at, method, month, year")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
    supabase
      .from("other_employees")
      .select("id, name, email, job_title, phone, joined_on, left_on, is_active, monthly_salary")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("other_salary_payments")
      .select("id, employee_id, amount, receipt_no, paid_at, method, month, year")
      .eq("school_id", schoolId)
      .eq("month", period.month)
      .eq("year", period.year),
  ]);

  const salaryMap = Object.fromEntries(
    (teacherSalaries || []).map((s) => [s.teacher_id, Number(s.monthly_salary || 0)])
  );
  const staffPaymentMap = Object.fromEntries(
    (staffPayments || []).map((p) => [p.teacher_id, p])
  );
  const otherPaymentMap = Object.fromEntries(
    (otherPayments || []).map((p) => [p.employee_id, p])
  );

  // Map Teachers
  const teachers: StaffSalaryItem[] = (staffProfiles || []).map((p) => {
    const pay = staffPaymentMap[p.id];
    return {
      id: p.id,
      name: p.name,
      role: "Teacher",
      email: p.email,
      phone: p.phone,
      joined_on: p.joined_on,
      monthly_salary: salaryMap[p.id] || 0,
      isPaid: Boolean(pay),
      paymentId: pay?.id || null,
      receipt: pay?.receipt_no || null,
      paidAmount: pay ? Number(pay.amount) : null,
      paidAt: pay?.paid_at || null,
      method: pay?.method || null,
    };
  });

  // Map Other Employees
  const otherEmployees: StaffSalaryItem[] = (otherEmployeesData || []).map((e) => {
    const pay = otherPaymentMap[e.id];
    return {
      id: e.id,
      name: e.name,
      role: e.job_title || "Staff",
      email: e.email,
      phone: e.phone,
      joined_on: e.joined_on,
      monthly_salary: Number(e.monthly_salary || 0),
      isPaid: Boolean(pay),
      paymentId: pay?.id || null,
      receipt: pay?.receipt_no || null,
      paidAmount: pay ? Number(pay.amount) : null,
      paidAt: pay?.paid_at || null,
      method: pay?.method || null,
    };
  });

  return (
    <Shell role="finance" title="Pay salaries">
      <div className="flex items-center justify-between gap-3">
        <Back href="/finance" label="← Finance Dashboard" />
      </div>

      <PrincipalSalaryView
        activeTab={activeTab}
        initialStatus={initialStatus}
        period={{
          month: period.month,
          year: period.year,
          label: period.label,
          isFuture: period.isFuture,
        }}
        teachers={teachers}
        otherEmployees={otherEmployees}
        basePath="/finance/salaries"
        hideFinanceTab={true}
      />
    </Shell>
  );
}
