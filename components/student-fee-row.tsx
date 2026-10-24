"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStudentFee } from "@/lib/actions";

interface StudentFeeRowProps {
  studentId: string;
  admissionFee: number;
  monthlyFee: number;
  transportFee: number;
  miscFee: number;
  discount: number;
  showAdmissionFee?: boolean;
  canEdit?: boolean;
}

export function StudentFeeRow({
  studentId,
  admissionFee: initAdmission,
  monthlyFee: initMonthly,
  transportFee: initTransport,
  miscFee: initMisc,
  discount: initDiscount,
  showAdmissionFee = false,
  canEdit = true,
}: StudentFeeRowProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [admissionFee, setAdmissionFee] = useState<string>(initAdmission ? String(initAdmission) : "");
  const [monthlyFee, setMonthlyFee] = useState<string>(initMonthly ? String(initMonthly) : "");
  const [transportFee, setTransportFee] = useState<string>(initTransport ? String(initTransport) : "");
  const [miscFee, setMiscFee] = useState<string>(initMisc ? String(initMisc) : "");
  const [discount, setDiscount] = useState<string>(initDiscount ? String(initDiscount) : "");

  useEffect(() => {
    setAdmissionFee(initAdmission ? String(initAdmission) : "");
    setMonthlyFee(initMonthly ? String(initMonthly) : "");
    setTransportFee(initTransport ? String(initTransport) : "");
    setMiscFee(initMisc ? String(initMisc) : "");
    setDiscount(initDiscount ? String(initDiscount) : "");
  }, [initAdmission, initMonthly, initTransport, initMisc, initDiscount]);

  const numMonthly = Number(monthlyFee) || 0;
  const numTransport = Number(transportFee) || 0;
  const numMisc = Number(miscFee) || 0;
  const numDiscount = Number(discount) || 0;
  const numAdmission = Number(admissionFee) || 0;

  const netMonthly = Math.max(0, numMonthly + numTransport + numMisc - numDiscount);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    fd.set("admission_fee", String(numAdmission));
    fd.set("monthly_fee", String(numMonthly));
    fd.set("transport_fee", String(numTransport));
    fd.set("misc_fee", String(numMisc));
    fd.set("discount", String(numDiscount));

    try {
      const res = await updateStudentFee(studentId, fd);
      if (res?.ok) {
        setMessage({ text: "Fee structure updated successfully", ok: true });
        setIsEditing(false);
        router.refresh();
      } else {
        setMessage({
          text: res?.error || "Failed to update fee",
          ok: false,
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

  const handleNumericChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setter(val);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs shadow-xs">
            💳
          </span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Fee Structure
          </h3>
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
          className={`rounded-xl px-3.5 py-2.5 text-xs border flex items-center gap-2 font-bold ${
            message.ok
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{message.ok ? "✓" : "⚠️"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Read View: Clean row of cards */}
      {!isEditing ? (
        <div className={`grid gap-3 ${showAdmissionFee ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"}`}>
          {showAdmissionFee && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Admission Fee
              </span>
              <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
                Rs. {numAdmission.toLocaleString()}
              </span>
            </div>
          )}

          {/* Monthly Tuition */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Tuition
            </span>
            <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
              Rs. {numMonthly.toLocaleString()}
            </span>
          </div>

          {/* Transport Fee */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Transport Fee
            </span>
            <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
              Rs. {numTransport.toLocaleString()}
            </span>
          </div>

          {/* Misc Charges */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Misc Charges
            </span>
            <span className="mt-1 block text-sm font-extrabold text-slate-800 tabular-nums">
              Rs. {numMisc.toLocaleString()}
            </span>
          </div>

          {/* Discount */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
            <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Monthly Discount
            </span>
            <span className="mt-1 block text-sm font-extrabold text-amber-700 tabular-nums">
              {numDiscount > 0 ? `- Rs. ${numDiscount.toLocaleString()}` : "Rs. 0"}
            </span>
          </div>

          {/* Net Monthly Payable */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-2xs">
            <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Net Monthly Fee
            </span>
            <span className="mt-1 block text-base font-black text-emerald-900 tabular-nums">
              Rs. {netMonthly.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* Edit Form: Pure digit input boxes with no browser spinner/dropdown arrows */
        <form onSubmit={handleSave} className="space-y-4">
          <div className={`grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 ${showAdmissionFee ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"}`}>
            {showAdmissionFee ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Admission Fee (PKR)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="admission_fee"
                  value={admissionFee}
                  onChange={handleNumericChange(setAdmissionFee)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            ) : (
              <input type="hidden" name="admission_fee" value={numAdmission} />
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Monthly Tuition (PKR)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="monthly_fee"
                value={monthlyFee}
                onChange={handleNumericChange(setMonthlyFee)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Transport Fee (PKR)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="transport_fee"
                value={transportFee}
                onChange={handleNumericChange(setTransportFee)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Misc Charges (PKR)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="misc_fee"
                value={miscFee}
                onChange={handleNumericChange(setMiscFee)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-brand-navy focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-800 mb-1">
                Monthly Discount (PKR)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="discount"
                value={discount}
                onChange={handleNumericChange(setDiscount)}
                placeholder="0"
                className="w-full rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold">Calculated Net Monthly:</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                Rs. {netMonthly.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setAdmissionFee(initAdmission ? String(initAdmission) : "");
                  setMonthlyFee(initMonthly ? String(initMonthly) : "");
                  setTransportFee(initTransport ? String(initTransport) : "");
                  setMiscFee(initMisc ? String(initMisc) : "");
                  setDiscount(initDiscount ? String(initDiscount) : "");
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
