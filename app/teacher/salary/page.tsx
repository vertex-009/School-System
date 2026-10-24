import { Shell } from "@/components/shell";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { TeacherSalaryClient, TeacherPaymentRecord } from "./teacher-salary-client";

export default async function TeacherSalaryPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string }>;
}) {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const sp = searchParams ? await searchParams : undefined;
  const period = parsePeriod(sp);

  const [{ data: salaryRow }, { data: thisPay }, { data: historyRows }] = await Promise.all([
    supabase
      .from("teacher_salaries")
      .select("monthly_salary")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .maybeSingle(),
    supabase
      .from("salary_payments")
      .select("id, amount, receipt_no, paid_at, method, month, year")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .eq("month", period.month)
      .eq("year", period.year)
      .maybeSingle(),
    supabase
      .from("salary_payments")
      .select("id, amount, receipt_no, paid_at, method, month, year")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
  ]);

  const monthly = Number(salaryRow?.monthly_salary || 0);

  const currentPayment: TeacherPaymentRecord | null = thisPay
    ? {
        id: thisPay.id,
        amount: Number(thisPay.amount || 0),
        month: thisPay.month,
        year: thisPay.year,
        receipt_no: thisPay.receipt_no,
        paid_at: thisPay.paid_at,
        method: thisPay.method,
      }
    : null;

  const history: TeacherPaymentRecord[] = (historyRows || []).map((row) => ({
    id: row.id,
    amount: Number(row.amount || 0),
    month: row.month,
    year: row.year,
    receipt_no: row.receipt_no,
    paid_at: row.paid_at,
    method: row.method,
  }));

  return (
    <Shell role="teacher" title="Salary">
      <TeacherSalaryClient
        period={period}
        monthlySalary={monthly}
        currentPayment={currentPayment}
        history={history}
      />
    </Shell>
  );
}
