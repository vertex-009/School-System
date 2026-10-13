"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { generateInvoices } from "@/lib/actions";
import { Card } from "@/components/ui";
import { MONTHS } from "@/lib/format";

export function GenerateInvoicesCard() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => generateInvoices(fd), null);

  const curKey = now.getFullYear() * 12 + (now.getMonth() + 1);
  const selectedKey = year * 12 + month;
  const isFuture = selectedKey > curKey;
  const label = `${MONTHS[month - 1]} ${year}`;

  return (
    <Card
      title="Generate invoices for this month"
      subtitle="Creates one unpaid invoice per active student for the selected month. Does not change older months. Does not run on page load."
    >
      {state?.ok && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
          {state.created ?? 0} new invoice(s) for {label}.{" "}
          <Link href={`/finance/collect?month=${month}&year=${year}`} className="underline">
            Collect cash
          </Link>
          {" · "}
          <Link href={`/finance/fee-records?tab=unpaid&month=${month}&year=${year}`} className="underline">
            Fee records
          </Link>
        </div>
      )}
      {state?.error && <p className="mb-3 text-sm font-bold text-rose-600">{state.error}</p>}

      <form action={action} className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-slate-600">
          Month
          <select
            name="month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
            className="mt-1 block w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <input type="hidden" name="due_day" value="10" />
        <button
          type="submit"
          disabled={pending || isFuture}
          className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60"
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
          Left students are skipped. Running again is safe (no duplicate invoices). Announcements are separate.
        </p>
      )}
    </Card>
  );
}
