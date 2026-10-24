"use client";

import { useState } from "react";
import { updateStudentFee } from "@/lib/actions";

interface StudentFeeRowProps {
  studentId: string;
  admissionFee: number;
  monthlyFee: number;
  transportFee: number;
  miscFee: number;
  discount: number;
  canEdit?: boolean;
}

export function StudentFeeRow({
  studentId,
  admissionFee: initAdmission,
  monthlyFee: initMonthly,
  transportFee: initTransport,
  miscFee: initMisc,
  discount: initDiscount,
  canEdit = true,
}: StudentFeeRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean; migrationNeeded?: boolean } | null>(null);

  const [admissionFee, setAdmissionFee] = useState<number>(initAdmission || 0);
  const [monthlyFee, setMonthlyFee] = useState<number>(initMonthly || 0);
  const [transportFee, setTransportFee] = useState<number>(initTransport || 0);
  const [miscFee, setMiscFee] = useState<number>(initMisc || 0);
  const [discount, setDiscount] = useState<number>(initDiscount || 0);

  const netMonthly = Math.max(0, monthlyFee + transportFee + miscFee - discount);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await updateStudentFee(studentId, fd);
      if (res?.ok) {
        setMessage({ text: "Fee structure updated successfully", ok: true });
        setIsEditing(false);
      } else {
        const isMigration =
          Boolean((res as any)?.migrationNeeded) ||
          res?.error?.toLowerCase().includes("schema cache") ||
          res?.error?.toLowerCase().includes("column");
        setMessage({
          text: isMigration
            ? "Database column missing: Supabase SQL Editor ma migration run krna zaroori hai."
            : res?.error || "Failed to update fee",
          ok: false,
          migrationNeeded: isMigration,
        });
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error updating fee",
        ok: false,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs shadow-xs">
            💳
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Fee Structure &amp; Concessions
            </h3>
            <p className="text-[11px] text-slate-500">
              Assigned monthly tuition, transport, misc fees, and student discount
            </p>
          </div>
        </div>

        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-brand-navy px-3 py-1.5 text-xs font-bold text-brand-navy transition cursor-pointer shadow-2xs"
          >
            <svg className="h-3.5 w-3.5 text-brand-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Change Fee
          </button>
        )}
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-xs border space-y-2.5 ${
            message.ok
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <span className="text-sm">{message.ok ? "✓" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>

          {message.migrationNeeded && (
            <div className="rounded-xl bg-white p-3.5 border border-rose-200/80 shadow-2xs space-y-2 text-slate-800 font-normal">
              <p className="text-[11px] font-bold text-rose-900">
                Fix: Supabase Dashboard &gt; SQL Editor ma ye 1 query run karein:
              </p>
              <pre className="rounded-lg bg-slate-900 text-emerald-400 p-3 text-[11px] font-mono overflow-x-auto select-all leading-relaxed">
{`ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS admission_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transport_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS misc_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;`}
              </pre>
              <p className="text-[10px] text-slate-500">
                Query run krne ke baad dobara &ldquo;Save Fee&rdquo; button dabayein, fee kamyabi se save ho jaye gi.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Read View: Shown in a row */}
      {!isEditing ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {/* 1. Admission Fee */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Admission Fee
            </span>
            <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
              Rs. {Number(admissionFee).toLocaleString()}
            </span>
          </div>

          {/* 2. Monthly Tuition */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Tuition
            </span>
            <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
              Rs. {Number(monthlyFee).toLocaleString()}
            </span>
          </div>

          {/* 3. Transport Fee */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Transport Fee
            </span>
            <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
              Rs. {Number(transportFee).toLocaleString()}
            </span>
          </div>

          {/* 4. Misc Charges */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Misc Charges
            </span>
            <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
              Rs. {Number(miscFee).toLocaleString()}
            </span>
          </div>

          {/* 5. Discount */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
            <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Monthly Discount
            </span>
            <span className="mt-1 block text-sm font-extrabold text-amber-700 tabular-nums">
              {discount > 0 ? `- Rs. ${Number(discount).toLocaleString()}` : "Rs. 0"}
            </span>
          </div>

          {/* 6. Net Monthly Payable */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-2xs">
            <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Net Monthly Fee
            </span>
            <span className="mt-1 block text-base font-black text-emerald-900 tabular-nums">
              Rs. {Number(netMonthly).toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* Edit Form: In-row inputs with Live Calculation */
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Admission Fee (PKR)
              </label>
              <input
                type="number"
                name="admission_fee"
                min={0}
                value={admissionFee}
                onChange={(e) => setAdmissionFee(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Monthly Tuition (PKR)
              </label>
              <input
                type="number"
                name="monthly_fee"
                min={0}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Transport Fee (PKR)
              </label>
              <input
                type="number"
                name="transport_fee"
                min={0}
                value={transportFee}
                onChange={(e) => setTransportFee(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Misc Charges (PKR)
              </label>
              <input
                type="number"
                name="misc_fee"
                min={0}
                value={miscFee}
                onChange={(e) => setMiscFee(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-800 mb-1">
                Monthly Discount (PKR)
              </label>
              <input
                type="number"
                name="discount"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold">Calculated Net Monthly:</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                Rs. {Number(netMonthly).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setAdmissionFee(initAdmission || 0);
                  setMonthlyFee(initMonthly || 0);
                  setTransportFee(initTransport || 0);
                  setMiscFee(initMisc || 0);
                  setDiscount(initDiscount || 0);
                  setIsEditing(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-brand-navy px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-accent transition disabled:opacity-60 cursor-pointer"
              >
                {pending ? "Saving…" : "Save Fee"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

