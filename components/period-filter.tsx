import { MONTHS } from "@/lib/format";
import type { Period } from "@/lib/period";
import { Card } from "@/components/ui";

/** Month / year GET filter — use on fee, salary, expense history pages. */
export function PeriodFilter({
  period,
  title = "Period",
  hidden,
  extra,
  submitLabel = "Show",
}: {
  period: Period;
  title?: string;
  /** Extra hidden inputs (e.g. tab) */
  hidden?: Record<string, string>;
  /** Extra fields rendered before the submit button */
  extra?: React.ReactNode;
  submitLabel?: string;
}) {
  return (
    <Card title={title}>
      <form method="get" className="flex flex-wrap items-end gap-3">
        {hidden &&
          Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <label className="text-xs font-bold text-slate-600">
          Month
          <select
            name="month"
            defaultValue={String(period.month)}
            className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
            max={2100}
            defaultValue={period.year}
            className="mt-1 block w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {extra}
        <button type="submit" className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent">
          {submitLabel}
        </button>
      </form>
    </Card>
  );
}

/** Empty period state — always “No record found”. */
export function NoHistory({
  period: _period,
  what: _what = "records",
}: {
  period: Period;
  what?: string;
}) {
  return <NoRecordFound />;
}

/** Shared empty message — use for future, before-hire, and empty history. */
export function NoRecordFound({ message = "No record found" }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <p className="text-base font-black text-brand-navy">{message}</p>
    </div>
  );
}

/** @deprecated use NoRecordFound */
export function FutureMonthNotice(_props: { period: Period; what?: string }) {
  return <NoRecordFound />;
}
