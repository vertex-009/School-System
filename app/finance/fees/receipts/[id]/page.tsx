import Image from "next/image";
import { PrintButton } from "@/components/print-button";
import { SCHOOL } from "@/lib/brand";
import { classNameOf } from "@/lib/class-label";
import { MONTHS, pkr } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ReceiptPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; by?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (!schoolId) redirect("/login");

  const { data: payment } = await supabase
    .from("payments")
    .select(
      "amount, method, receipt_no, paid_at, fee_invoices(month, year, amount, discount, students(name, father_name, roll_no, sections(name, classes(name))))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!payment) redirect("/finance/fees/receipts");

  // Optional columns from migration_payment_received.sql (ignore if missing)
  let storedFrom = "";
  let storedBy = "";
  const { data: meta } = await supabase
    .from("payments")
    .select("received_from, received_by")
    .eq("id", id)
    .maybeSingle();
  if (meta) {
    storedFrom = String((meta as { received_from?: string }).received_from || "").trim();
    storedBy = String((meta as { received_by?: string }).received_by || "").trim();
  }

  const inv = payment.fee_invoices as {
    month?: number;
    year?: number;
    amount?: number;
    discount?: number;
    students?: {
      name?: string;
      father_name?: string;
      roll_no?: number | null;
      sections?: unknown;
    } | null;
  } | null;

  const student = inv?.students;
  const className = classNameOf(student?.sections);
  const paidAt = new Date(payment.paid_at);
  const feeMonth =
    inv?.month && inv?.year ? `${MONTHS[(inv.month || 1) - 1]} ${inv.year}` : "—";
  const methodLabel = String(payment.method || "cash").replace(/_/g, " ");

  const receivedFrom =
    sp.from?.trim() || storedFrom || student?.father_name?.trim() || "—";
  const receivedBy = sp.by?.trim() || storedBy || profile.name?.trim() || "Finance";

  return (
    <div className="fee-receipt mx-auto max-w-md bg-white p-6 text-slate-900 print:max-w-none print:p-0">
      <div className="border-b border-slate-900 pb-3 text-center">
        <div className="relative mx-auto mb-2 h-14 w-14 overflow-hidden rounded-lg">
          <Image src={SCHOOL.logoSrc} alt="" fill sizes="56px" className="object-cover object-center" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-brand-navy">{SCHOOL.name}</h1>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {SCHOOL.fullName} · {SCHOOL.city}
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-700">Fee receipt</p>
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Receipt no.</dt>
          <dd className="font-mono text-xs font-bold">{payment.receipt_no}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Date</dt>
          <dd className="font-semibold">
            {paidAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Time</dt>
          <dd className="font-semibold">
            {paidAt.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
          </dd>
        </div>

        <div className="my-2 border-t border-dashed border-slate-200" />

        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Name</dt>
          <dd className="font-bold">{student?.name || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Father name</dt>
          <dd>{student?.father_name || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Class</dt>
          <dd className="font-semibold">{className}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Roll no.</dt>
          <dd className="font-semibold">{student?.roll_no ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Fee month</dt>
          <dd className="font-semibold">{feeMonth}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Payment</dt>
          <dd className="font-semibold capitalize">{methodLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Received from</dt>
          <dd className="font-semibold">{receivedFrom}</dd>
        </div>

        <div className="my-2 border-t border-dashed border-slate-200" />

        <div className="flex justify-between gap-4 text-base">
          <dt className="font-bold">Cash received</dt>
          <dd className="font-black">{pkr(payment.amount)}</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-slate-100 pt-3 text-center">
        <p className="text-[11px] text-slate-400">
          Received by — <span className="font-medium text-slate-500">{receivedBy}</span>
        </p>
      </div>

      <PrintButton />
    </div>
  );
}
