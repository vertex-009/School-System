import { PrintButton } from "@/components/print-button";
import { MONTHS, pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherSalaryReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const [{ data: school }, { data: payment }] = await Promise.all([
    supabase.from("schools").select("name, address, phone").eq("id", schoolId).maybeSingle(),
    supabase
      .from("salary_payments")
      .select("id, amount, method, receipt_no, paid_at, month, year, teacher_id")
      .eq("id", id)
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .maybeSingle(),
  ]);

  if (!payment) redirect("/teacher/salary/history");

  const paidAt = new Date(payment.paid_at);
  const monthLabel = `${MONTHS[payment.month - 1]} ${payment.year}`;

  return (
    <div className="mx-auto max-w-md bg-white p-8 text-slate-900 print:max-w-none print:p-6">
      <div className="border-b-2 border-slate-900 pb-4 text-center">
        <h1 className="text-2xl font-black uppercase tracking-tight text-brand-navy">
          City Public School
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-slate-600">
          Abbottabad, KPK, Pakistan
        </p>
        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-slate-700">Salary receipt</p>
      </div>

      <dl className="mt-6 space-y-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Receipt no.</dt>
          <dd className="font-mono font-bold">{payment.receipt_no}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Date</dt>
          <dd className="font-semibold">{paidAt.toLocaleDateString()}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Time</dt>
          <dd className="font-semibold">{paidAt.toLocaleTimeString()}</dd>
        </div>
        <div className="my-3 border-t border-dashed border-slate-200" />
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Staff</dt>
          <dd className="font-bold">{profile.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Salary month</dt>
          <dd className="font-semibold">{monthLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Method</dt>
          <dd className="capitalize">{payment.method}</dd>
        </div>
        <div className="my-3 border-t border-dashed border-slate-200" />
        <div className="flex justify-between gap-4 text-base">
          <dt className="font-bold">Amount paid</dt>
          <dd className="font-black">{pkr(payment.amount)}</dd>
        </div>
      </dl>

      <div className="mt-8 border-t border-slate-300 pt-4 text-center text-xs text-slate-600">
        <p className="font-bold text-slate-900">Printed from: Teacher Portal ({profile.name})</p>
        <p className="text-[11px] text-slate-500 mt-0.5">City Public School Abbottabad KPK Pakistan · Personal Salary Voucher</p>
      </div>

      <PrintButton />
    </div>
  );
}
