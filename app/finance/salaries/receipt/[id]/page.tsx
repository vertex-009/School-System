import Image from "next/image";
import { PrintButton } from "@/components/print-button";
import { SCHOOL } from "@/lib/brand";
import { MONTHS, pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FinanceSalaryReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; month?: string; year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (!schoolId || !["finance", "principal"].includes(profile.role)) {
    redirect("/login");
  }

  const period = parsePeriod(sp);
  const type = sp.type === "employees" ? "employees" : "teachers";

  const { data: school } = await supabase
    .from("schools")
    .select("name, address, phone")
    .eq("id", schoolId)
    .maybeSingle();

  let payment: {
    id: string;
    amount: number;
    method?: string | null;
    receipt_no: string;
    paid_at: string;
    month: number;
    year: number;
  } | null = null;

  let staffInfo: {
    name: string;
    role: string;
    phone?: string | null;
    email?: string | null;
    cnic?: string | null;
    joined_on?: string | null;
    monthly_salary?: number;
  } | null = null;

  if (type === "employees") {
    let { data: pay } = await supabase
      .from("other_salary_payments")
      .select("id, employee_id, amount, method, receipt_no, paid_at, month, year")
      .eq("id", id)
      .eq("school_id", schoolId)
      .maybeSingle();

    if (!pay) {
      const { data: payByEmp } = await supabase
        .from("other_salary_payments")
        .select("id, employee_id, amount, method, receipt_no, paid_at, month, year")
        .eq("employee_id", id)
        .eq("school_id", schoolId)
        .eq("month", period.month)
        .eq("year", period.year)
        .maybeSingle();
      pay = payByEmp;
    }

    if (pay) {
      payment = pay;
      const { data: emp } = await supabase
        .from("other_employees")
        .select("id, name, job_title, phone, email, cnic, joined_on, monthly_salary")
        .eq("id", pay.employee_id)
        .eq("school_id", schoolId)
        .maybeSingle();

      if (emp) {
        staffInfo = {
          name: emp.name,
          role: emp.job_title || "Staff Member",
          phone: emp.phone,
          email: emp.email,
          cnic: (emp as { cnic?: string | null }).cnic,
          joined_on: emp.joined_on,
          monthly_salary: Number(emp.monthly_salary || 0),
        };
      }
    }
  } else {
    let { data: pay } = await supabase
      .from("salary_payments")
      .select("id, teacher_id, amount, method, receipt_no, paid_at, month, year")
      .eq("id", id)
      .eq("school_id", schoolId)
      .maybeSingle();

    if (!pay) {
      const { data: payByTeacher } = await supabase
        .from("salary_payments")
        .select("id, teacher_id, amount, method, receipt_no, paid_at, month, year")
        .eq("teacher_id", id)
        .eq("school_id", schoolId)
        .eq("month", period.month)
        .eq("year", period.year)
        .maybeSingle();
      pay = payByTeacher;
    }

    if (pay) {
      payment = pay;
      const [{ data: prof }, { data: sal }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, role, phone, email, cnic, joined_on")
          .eq("id", pay.teacher_id)
          .eq("school_id", schoolId)
          .maybeSingle(),
        supabase
          .from("teacher_salaries")
          .select("monthly_salary")
          .eq("teacher_id", pay.teacher_id)
          .eq("school_id", schoolId)
          .maybeSingle(),
      ]);

      if (prof) {
        staffInfo = {
          name: prof.name,
          role: "Faculty Teacher",
          phone: prof.phone,
          email: prof.email,
          cnic: (prof as { cnic?: string | null }).cnic,
          joined_on: prof.joined_on,
          monthly_salary: Number(sal?.monthly_salary || 0),
        };
      }
    }
  }

  if (!payment || !staffInfo) {
    redirect(`/finance/salaries?type=${type}&month=${period.month}&year=${period.year}`);
  }

  const paidAt = new Date(payment.paid_at);
  const salaryMonth = `${MONTHS[(payment.month || 1) - 1]} ${payment.year}`;
  const methodLabel = String(payment.method || "cash").replace(/_/g, " ");

  return (
    <div className="salary-receipt mx-auto max-w-lg bg-white p-8 text-slate-900 print:max-w-none print:p-4">
      {/* Official School Header */}
      <div className="border-b-2 border-slate-900 pb-4 text-center">
        <div className="relative mx-auto mb-2.5 h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
          <Image src={SCHOOL.logoSrc} alt="" fill sizes="64px" className="object-cover object-center" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight text-brand-navy">
          City Public School
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-600">
          Abbottabad, KPK, Pakistan
        </p>
        <div className="mt-2.5 inline-block rounded-md bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-800">
          Official Staff Salary Payment Voucher
        </div>
      </div>

      {/* Voucher Meta Details */}
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Receipt / Voucher No.</dt>
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

        {/* Staff Information */}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Employee Name</dt>
          <dd className="font-black text-base text-brand-navy">{staffInfo.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Designation / Role</dt>
          <dd className="font-semibold capitalize text-slate-800">{staffInfo.role}</dd>
        </div>
        {staffInfo.cnic && (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 font-medium">CNIC / ID No.</dt>
            <dd className="font-mono text-xs font-semibold text-slate-700">{staffInfo.cnic}</dd>
          </div>
        )}
        {staffInfo.phone && (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 font-medium">Contact Phone</dt>
            <dd className="font-semibold text-slate-700">{staffInfo.phone}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Disbursed Month</dt>
          <dd className="font-bold text-slate-900">{salaryMonth}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Payment Mode</dt>
          <dd className="font-semibold capitalize text-slate-800">{methodLabel}</dd>
        </div>

        <div className="my-2 border-t border-dashed border-slate-200" />

        {/* Financial Breakdown */}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500 font-medium">Standard Monthly Salary</dt>
          <dd className="font-semibold tabular-nums text-slate-700">
            {pkr(Number(staffInfo.monthly_salary || payment.amount))}
          </dd>
        </div>
        <div className="flex justify-between gap-4 pt-1 text-base">
          <dt className="font-bold text-slate-900">Net Salary Disbursed</dt>
          <dd className="font-black text-lg text-emerald-800 tabular-nums">
            {pkr(Number(payment.amount))}
          </dd>
        </div>
      </dl>

      {/* Official Footer in Print */}
      <div className="mt-8 border-t border-slate-300 pt-4 text-center text-xs text-slate-600">
        <p className="font-bold text-slate-900">Disbursed &amp; Issued by: Finance Dashboard ({profile.name || "Finance"})</p>
        <p className="text-[11px] text-slate-500 mt-0.5">City Public School Abbottabad KPK Pakistan · Official Salary Voucher</p>
      </div>

      <p className="mt-8 text-center text-[10px] text-slate-400 print:hidden">
        Printed on {new Date().toLocaleString()} · Executive Disbursal Ledger Record
      </p>

      <PrintButton />
    </div>
  );
}
