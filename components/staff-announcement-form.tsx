"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { saveAnnouncement } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back, Card, Field } from "@/components/ui";
import { MONTHS } from "@/lib/format";

const OPTIONS: Record<"teacher" | "finance", { value: string; label: string }[]> = {
  teacher: [
    { value: "principal", label: "Principal" },
    { value: "finance", label: "Finance" },
  ],
  finance: [
    { value: "principal", label: "Principal" },
    { value: "teachers", label: "All teachers" },
  ],
};

export function StaffAnnouncementForm({ role }: { role: "teacher" | "finance" }) {
  const options = OPTIONS[role];
  const [selected, setSelected] = useState<string[]>(() => options.map((o) => o.value));
  const [kind, setKind] = useState<"general" | "fee_open">("general");
  const now = useMemo(() => new Date(), []);
  const [feeMonth, setFeeMonth] = useState(now.getMonth() + 1);
  const [feeYear, setFeeYear] = useState(now.getFullYear());
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => saveAnnouncement(fd), null);
  const historyHref = `/${role}/announcements`;

  const curKey = now.getFullYear() * 12 + (now.getMonth() + 1);
  const selectedKey = feeYear * 12 + feeMonth;
  const isFutureFee = selectedKey > curKey;
  const feeLabel = `${MONTHS[feeMonth - 1]} ${feeYear}`;
  const feeBodyOk = kind !== "fee_open" || body.trim().length >= 8;

  function toggle(value: string) {
    setSelected((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]));
  }

  return (
    <Shell role={role} title="Make announcement">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href={historyHref} label="← History" />
        <Link href={historyHref} className="text-xs font-bold text-brand-accent hover:underline">
          View history →
        </Link>
      </div>

      {state?.ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {state.kind === "fee_open" ? (
            <>
              Fee announcement sent
              {state.feeLabel ? ` · ${state.feeLabel}` : ""}. Generate invoices separately from the Dashboard.{" "}
            </>
          ) : (
            <>Announcement sent. </>
          )}
          <Link href={historyHref} className="underline">
            See history
          </Link>
        </div>
      )}
      {state?.error && <p className="text-sm font-bold text-rose-600">{state.error}</p>}

      <Card
        title="New announcement"
        subtitle={
          role === "teacher"
            ? "Select Principal, Finance, or both"
            : kind === "fee_open"
              ? "Prefer Finance dashboard for fee open — same checks apply here"
              : "Select Principal, all teachers, or both"
        }
      >
        <form action={action} className="space-y-3">
          {role === "finance" && kind === "fee_open" && (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Tip: use{" "}
              <Link href="/finance" className="font-bold text-brand-accent underline">
                Dashboard → Open fee collection
              </Link>{" "}
              for the main flow (invoices + announce + updates).
            </p>
          )}
          {role === "finance" && (
            <fieldset>
              <legend className="text-xs font-bold text-slate-600">Type</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { value: "general" as const, label: "General" },
                    { value: "fee_open" as const, label: "Fee collection open" },
                  ] as const
                ).map((o) => {
                  const on = kind === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                        on
                          ? "border-brand-navy bg-brand-navy text-white"
                          : "border-slate-200 bg-white text-brand-navy hover:border-brand-sky"
                      }`}
                    >
                      <input
                        type="radio"
                        name="kind"
                        value={o.value}
                        checked={on}
                        onChange={() => setKind(o.value)}
                        className="sr-only"
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {role === "finance" && kind === "fee_open" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-600">Fee month (calendar)</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Defaults to today&apos;s month. Future months are blocked — same rule as Generate invoices.
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
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
              </div>
              {isFutureFee ? (
                <p className="mt-2 text-xs font-bold text-rose-600">
                  {feeLabel} is in the future — announcement will not be sent. Pick current or previous month.
                </p>
              ) : (
                <p className="mt-2 text-xs font-semibold text-emerald-800">
                  Will open fees for <span className="font-black">{feeLabel}</span> and generate unpaid invoices.
                </p>
              )}
            </div>
          )}

          <Field
            label="Title"
            name="title"
            required={kind !== "fee_open"}
            placeholder={kind === "fee_open" ? `Fee collection open — ${feeLabel}` : undefined}
          />
          <label className="block text-xs font-bold text-slate-600">
            Body
            <textarea
              name="body"
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                kind === "fee_open"
                  ? `Fee collection for ${feeLabel} is now open. Please inform parents.`
                  : undefined
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
            />
          </label>
          {kind === "fee_open" && body.length > 0 && !feeBodyOk && (
            <p className="text-xs font-bold text-rose-600">Write a short notice (a few words).</p>
          )}

          <fieldset>
            <legend className="text-xs font-bold text-slate-600">Send to (select one or more)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <label
                    key={o.value}
                    className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
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
            disabled={pending || !selected.length || (kind === "fee_open" && (isFutureFee || !feeBodyOk))}
            className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60"
          >
            {pending
              ? kind === "fee_open"
                ? "Opening fees…"
                : "Sending…"
              : kind === "fee_open"
                ? `Open fees · ${feeLabel}`
                : "Send announcement"}
          </button>
        </form>
      </Card>
    </Shell>
  );
}
