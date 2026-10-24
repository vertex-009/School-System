"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { generateInvoices } from "@/lib/actions";
import { MONTHS } from "@/lib/format";

export function GenerateInvoicesCard({
  role = "finance",
  initialMonth,
  initialYear,
}: {
  role?: "principal" | "finance";
  initialMonth?: number;
  initialYear?: number;
} = {}) {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => generateInvoices(fd), null);

  const curKey = now.getFullYear() * 12 + (now.getMonth() + 1);
  const selectedKey = year * 12 + month;
  const isFuture = selectedKey > curKey;
  const label = `${MONTHS[month - 1]} ${year}`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#e8f3fc] via-[#eef6fc] to-[#f5f9fd] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:p-6">
      {/* Invoice illustration */}
      <div className="pointer-events-none absolute -right-2 bottom-0 top-0 hidden w-44 items-center justify-center sm:flex md:w-52" aria-hidden>
        <div className="relative">
          <div className="h-28 w-20 -rotate-6 rounded-lg border border-slate-200/80 bg-white shadow-md md:h-32 md:w-24">
            <div className="space-y-1.5 p-3">
              <div className="h-1.5 w-10 rounded bg-slate-200" />
              <div className="h-1.5 w-14 rounded bg-slate-100" />
              <div className="h-1.5 w-12 rounded bg-slate-100" />
              <div className="mt-3 h-1.5 w-full rounded bg-slate-100" />
              <div className="h-1.5 w-full rounded bg-slate-100" />
              <div className="h-1.5 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
          <div className="absolute -right-3 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b1f3a] text-sm font-bold text-white shadow-lg">
            Rs
          </div>
        </div>
      </div>

      <div className="relative z-[1] max-w-2xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#3b9fd9] shadow-sm ring-1 ring-sky-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M8 3h6l4 4v14H8V3z" />
              <path d="M14 3v4h4M10 13h6M10 17h4" />
            </svg>
          </span>
          <div>
            <h2 className="text-base font-bold text-[#0b1f3a]">Generate invoices for this month</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-[13px]">
              Creates one unpaid invoice per active student for the selected month. Does not change older months.
              Does not run on page load.
            </p>
          </div>
        </div>

        {state?.ok && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
            {state.created ?? 0} new invoice(s) for {label}.{" "}
            {role === "principal" ? (
              <Link href={`/principal/fees/overview?month=${month}&year=${year}`} className="underline">
                View fee overview
              </Link>
            ) : (
              <>
                <Link href={`/finance/collect?month=${month}&year=${year}`} className="underline">
                  Collect cash
                </Link>
                {" · "}
                <Link href={`/finance/fee-records?tab=unpaid&month=${month}&year=${year}`} className="underline">
                  Fee records
                </Link>
              </>
            )}
          </div>
        )}
        {state?.error && <p className="mt-3 text-sm font-bold text-rose-600">{state.error}</p>}

        <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-600">
            Month
            <select
              name="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 block min-w-[8.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#0b1f3a] shadow-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Year
            <input
              name="year"
              type="number"
              min={2000}
              max={now.getFullYear()}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-1 block w-28 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#0b1f3a] shadow-sm"
            />
          </label>
          <input type="hidden" name="due_day" value="10" />
          <button
            type="submit"
            disabled={pending || isFuture}
            className="rounded-xl bg-[#0b1f3a] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#123a5c] disabled:opacity-60"
          >
            {pending ? "Generating…" : `Generate invoices · ${label}`}
          </button>
        </form>

        {isFuture ? (
          <p className="mt-2 text-xs font-bold text-rose-600">
            {label} is in the future — generation is blocked. Pick current or previous month.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Left students are skipped. Running again is safe (no duplicate invoices).
          </p>
        )}
      </div>
    </section>
  );
}
