"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { openFeeCollection } from "@/lib/actions";
import { Card } from "@/components/ui";
import { MONTHS } from "@/lib/format";

export function FeeOpenCard({
  latestLabel,
  missingMigration,
}: {
  latestLabel?: string | null;
  missingMigration?: boolean;
}) {
  const now = useMemo(() => new Date(), []);
  const [feeMonth, setFeeMonth] = useState(now.getMonth() + 1);
  const [feeYear, setFeeYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string[]>(["principal", "teachers"]);
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => openFeeCollection(fd), null);

  const curKey = now.getFullYear() * 12 + (now.getMonth() + 1);
  const selectedKey = feeYear * 12 + feeMonth;
  const isFuture = selectedKey > curKey;
  const feeLabel = `${MONTHS[feeMonth - 1]} ${feeYear}`;
  const bodyOk = body.trim().length >= 8;
  const canSubmit = !pending && !isFuture && bodyOk && selected.length > 0 && !missingMigration;

  function toggle(value: string) {
    setSelected((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]));
  }

  return (
    <Card
      title="Open fee collection"
      subtitle="Pick month from calendar (current or past). This generates invoices and notifies Principal / Teachers."
    >
      {missingMigration && (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          Run <code className="font-mono">migration_fee_announcement.sql</code> in Supabase before opening fees.
        </p>
      )}

      {latestLabel && !state?.ok && (
        <p className="mb-3 text-xs font-semibold text-slate-600">
          Last opened: <span className="font-black text-brand-navy">{latestLabel}</span>
        </p>
      )}

      {state?.ok && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
          Announcement sent · {state.feeLabel}. Generate invoices from the Dashboard (separate step).{" "}
          <Link href="/finance" className="underline">
            Dashboard
          </Link>
        </div>
      )}
      {state?.error && <p className="mb-3 text-sm font-bold text-rose-600">{state.error}</p>}

      <form action={action} className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-600">
            Month
            <select
              name="fee_month"
              value={feeMonth}
              onChange={(e) => setFeeMonth(Number(e.target.value))}
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
              name="fee_year"
              type="number"
              min={2000}
              max={now.getFullYear()}
              value={feeYear}
              onChange={(e) => setFeeYear(Number(e.target.value))}
              className="mt-1 block w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Due day
            <input
              name="due_day"
              type="number"
              min={1}
              max={28}
              defaultValue={10}
              className="mt-1 block w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        {isFuture ? (
          <p className="text-xs font-bold text-rose-600">
            {feeLabel} is in the future — cannot open. Pick current or previous month.
          </p>
        ) : (
          <p className="text-xs font-semibold text-emerald-800">
            Will open <span className="font-black">{feeLabel}</span> and update Collect / Fee records / unpaid lists.
          </p>
        )}

        <label className="block text-xs font-bold text-slate-600">
          Title (optional)
          <input
            name="title"
            placeholder={`Fee collection open — ${feeLabel}`}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-sky focus:bg-white"
          />
        </label>

        <label className="block text-xs font-bold text-slate-600">
          Announcement body
          <textarea
            name="body"
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Fee collection for ${feeLabel} is now open. Please inform parents.`}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-sky focus:bg-white"
          />
        </label>
        {!bodyOk && body.length > 0 && (
          <p className="text-xs font-bold text-rose-600">Write a short notice (a few words).</p>
        )}

        <fieldset>
          <legend className="text-xs font-bold text-slate-600">Notify</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { value: "principal", label: "Principal" },
                { value: "teachers", label: "All teachers" },
              ] as const
            ).map((o) => {
              const on = selected.includes(o.value);
              return (
                <label
                  key={o.value}
                  className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    on
                      ? "border-brand-navy bg-brand-navy text-white"
                      : "border-slate-200 bg-white text-brand-navy hover:border-brand-sky"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="audience"
                    value={o.value}
                    checked={on}
                    onChange={() => toggle(o.value)}
                    className="sr-only"
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
          {!selected.length && (
            <p className="mt-2 text-xs font-bold text-rose-600">Pick at least one recipient</p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60"
        >
          {pending ? "Opening…" : `Open fees · ${feeLabel}`}
        </button>
      </form>
    </Card>
  );
}
