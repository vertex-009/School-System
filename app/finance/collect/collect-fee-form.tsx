"use client";

import { useState } from "react";
import { collectFee } from "@/lib/actions";
import { pkr } from "@/lib/format";

type FeeLine = {
  id?: string;
  label: string;
  due: number;
  month: number;
  year: number;
};

export function CollectFeeLineForm({
  line,
  fatherName,
}: {
  line: FeeLine;
  fatherName: string;
  financeName?: string;
  isOldest?: boolean;
}) {
  const [discount, setDiscount] = useState<number | "">("");
  const [amount, setAmount] = useState<number>(line.due);
  const [receivedFrom, setReceivedFrom] = useState(fatherName || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const originalDue = line.due;

  function handleDiscountChange(val: string) {
    if (val === "") {
      setDiscount("");
      setAmount(originalDue);
      return;
    }
    const d = Math.max(0, Number(val));
    setDiscount(d);
    setAmount(Math.max(0, originalDue - d));
  }

  return (
    <form
      action={async (fd) => {
        setSubmitting(true);
        setErrorMsg("");
        try {
          const r = await collectFee(fd);
          if (r?.error) {
            setErrorMsg(r.error);
            setSubmitting(false);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Error collecting fee";
          setErrorMsg(msg);
          setSubmitting(false);
        }
      }}
      className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300 space-y-4"
    >
      <input type="hidden" name="invoice_id" value={line.id || ""} />

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 animate-fadeIn">
          {errorMsg}
        </div>
      )}

      {/* Line Header: Month and Due */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base text-[#0b1f3a]">{line.label}</span>
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/60">
            Unpaid Fee
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold mr-1.5">Net Due:</span>
          <span className="text-base font-black text-rose-700 tabular-nums">{pkr(originalDue)}</span>
        </div>
      </div>

      {/* Payment Inputs Grid: Discount, Amount to Collect, Payment Method, Received From */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 items-end">
        {/* 1. Discount (PKR) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Discount (PKR)
          </label>
          <input
            name="discount"
            type="number"
            min={0}
            max={originalDue}
            value={discount}
            onChange={(e) => handleDiscountChange(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30"
          />
        </div>

        {/* 2. Amount to Collect (PKR) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Cash / Amount (PKR)
          </label>
          <input
            name="amount"
            type="number"
            min={1}
            max={Math.max(1, originalDue - (typeof discount === "number" ? discount : 0))}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            className="w-full rounded-xl border border-emerald-300 bg-emerald-50/40 px-3 py-2 text-sm font-black text-emerald-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 tabular-nums"
          />
        </div>

        {/* 3. Payment Method */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Payment Method
          </label>
          <select
            name="method"
            defaultValue="cash"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">EasyPaisa</option>
          </select>
        </div>

        {/* 4. Received From */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Received From
          </label>
          <input
            name="received_from"
            type="text"
            value={receivedFrom}
            onChange={(e) => setReceivedFrom(e.target.value)}
            placeholder="Payer name"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          Total to receive: <b className="text-emerald-800 text-sm">{pkr(amount)}</b>
          {typeof discount === "number" && discount > 0 && (
            <span className="text-amber-700 ml-2 font-semibold">(-{pkr(discount)} discount)</span>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || amount <= 0 || !line.id}
          className="rounded-xl bg-[#0b1f3a] hover:bg-brand-accent px-5 py-2.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-60 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          {submitting ? (
            "Processing…"
          ) : (
            <>
              <span>Collect {pkr(amount)} &amp; Print Receipt</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
