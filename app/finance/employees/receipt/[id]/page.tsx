import Image from "next/image";
import { PrintButton } from "@/components/print-button";
import { SCHOOL } from "@/lib/brand";
import { MONTHS, pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function OtherEmployeeSalaryReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, schoolId, profile } = await getContext();
  if (!schoolId || !["finance", "principal"].includes(profile.role)) {
    redirect("/login");
  }

  const [{ data: payment }, { data: school }] = await Promise.all([
    supabase
      .from("other_salary_payments")
      .select("id, employee_id, amount, method, receipt_no, paid_at, month, year")
      .eq("id", id)
      .eq("school_id", schoolId)
      .maybeSingle(),
    supabase
      .from("schools")
      .select("name, address, phone")
      .eq("id", schoolId)
      .maybeSingle(),
  ]);

  if (!payment) {
    redirect("/finance/employees/pay#history");
  }

  const { data: employee } = await supabase
    .from("other_employees")
    .select("id, name, job_title, phone, monthly_salary")
    .eq("id", payment.employee_id)
    .maybeSingle();

  const paidAt = new Date(payment.paid_at);
  const salaryMonth = `${MONTHS[(payment.month || 1) - 1]} ${payment.year}`;
  const methodLabel = String(payment.method || "cash").replace(/_/g, " ");

  return (
    <div className="salary-receipt mx-auto max-w-lg bg-white p-8 text-slate-900 print:max-w-none print:p-4">
      {/* School Header */}
      <div className="border-b-2 border-slate-900 pb-4 text-center">
        <div className="relative mx-auto mb-2 h-14 w-14 overflow-hidden rounded-xl border border-slate-200">
          <Image src={SCHOOL.logoSrc} alt="" fill sizes="56px" className="object-cover object-center" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight text-brand-navy">
          City Public School
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-600">
          Abbottabad, KPK, Pakistan
        </p>
        <div className="mt-2.5 inline-block rounded-md bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-800">
          Staff Salary Payment Voucher
        </div>
      </div>

      {/* Voucher Meta */}
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Voucher / Receipt no.</dt>
          <dd className="font-mono text-xs font-bold text-slate-900">{payment.receipt_no}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Payment Date &amp; Time</dt>
          <dd className="font-semibold">
            {paidAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })},{" "}
            {paidAt.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
          </dd>
        </div>

        <div className="my-2 border-t border-dashed border-slate-200" />

        {/* Employee Info */}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Employee Name</dt>
          <dd className="font-black text-base text-brand-navy">{employee?.name || "Staff Member"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Designation / Role</dt>
          <dd className="font-semibold capitalize text-slate-800">{employee?.job_title || "Other Staff"}</dd>
        </div>
        {employee?.phone && (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 font-medium">Contact Phone</dt>
            <dd className="font-semibold text-slate-700">{employee.phone}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Salary Month</dt>
          <dd className="font-bold text-slate-900">{salaryMonth}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Payment Mode</dt>
          <dd className="font-semibold capitalize text-slate-800">{methodLabel}</dd>
        </div>

        <div className="my-2 border-t border-dashed border-slate-200" />

        {/* Financials */}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Standard Monthly Salary</dt>
          <dd className="font-semibold tabular-nums text-slate-700">{pkr(Number(employee?.monthly_salary || payment.amount))}</dd>
        </div>
        <div className="flex justify-between gap-4 pt-1 text-base">
          <dt className="font-bold text-slate-900">Net Salary Paid</dt>
          <dd className="font-black text-lg text-emerald-800 tabular-nums">{pkr(Number(payment.amount))}</dd>
        </div>
      </dl>

      {/* Official Footer in Print */}
      <div className="mt-8 border-t border-slate-300 pt-4 text-center text-xs text-slate-600">
        <p className="font-bold text-slate-900">Disbursed &amp; Issued by: Finance Dashboard ({profile.name || "Finance"})</p>
        <p className="text-[11px] text-slate-500 mt-0.5">City Public School Abbottabad KPK Pakistan · Staff Disbursal Record</p>
      </div>

      <p className="mt-8 text-center text-[10px] text-slate-400 print:hidden">
        Printed on {new Date().toLocaleString()} · Official School Staff Payment Record
      </p>

      <PrintButton />
    </div>
  );
}

