import Link from "next/link";

export type DashStat = {
  label: string;
  value: number | string;
  href?: string;
  tone?: "navy" | "sky" | "emerald" | "amber" | "rose";
  hint?: string;
};

const TONE_BAR = {
  navy: "bg-brand-navy",
  sky: "bg-sky-500",
  emerald: "bg-emerald-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

/** Compact metric tiles — clean admin look */
export function StatTiles({ items }: { items: DashStat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const inner = (
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_BAR[item.tone || "navy"]}`} />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-brand-navy">{item.value}</p>
            {item.hint && <p className="mt-1 text-[11px] text-slate-400">{item.hint}</p>}
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={item.label}>{inner}</div>
        );
      })}
    </div>
  );
}

export type BarItem = { label: string; value: number; color?: string };

/** Vertical column chart */
export function ColumnChartCard({ title, subtitle, items }: { title: string; subtitle?: string; items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-brand-navy">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex h-44 items-end gap-3">
        {items.map((item) => {
          const h = Math.max(6, Math.round((item.value / max) * 100));
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">{item.value}</span>
              <div className="flex h-32 w-full items-end justify-center rounded-t-md bg-slate-50 px-1">
                <div
                  className="w-full max-w-[2.25rem] rounded-t-md transition-all"
                  style={{ height: `${h}%`, background: item.color || "#0b1f3a" }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
              <span className="w-full truncate text-center text-[10px] font-medium text-slate-500">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Horizontal bar chart */
export function BarChartCard({ title, subtitle, items }: { title: string; subtitle?: string; items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-brand-navy">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <ul className="space-y-3.5">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-slate-600">{item.label}</span>
              <span className="shrink-0 font-bold tabular-nums text-brand-navy">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-slate-100">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${Math.round((item.value / max) * 100)}%`,
                  background: item.color || "#0b1f3a",
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Donut-style ring for a ratio */
export function RingCard({
  title,
  percent,
  center,
  footnote,
  color = "#0b1f3a",
}: {
  title: string;
  percent: number;
  center: string;
  footnote?: string;
  color?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5">
      <h2 className="text-sm font-bold text-brand-navy">{title}</h2>
      <div className="mt-5 flex flex-col items-center">
        <div className="relative">
          <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
            <circle cx="66" cy="66" r={r} fill="none" stroke="#eef2f7" strokeWidth="10" />
            <circle
              cx="66"
              cy="66"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xl font-bold text-brand-navy">{center}</p>
            {footnote && <p className="mt-0.5 max-w-[5.5rem] text-[10px] font-medium leading-tight text-slate-400">{footnote}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Simple KPI strip under dashboard title area */
export function DashIntro({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-1 rounded-xl border border-slate-200/80 bg-gradient-to-r from-brand-navy to-brand-accent px-5 py-4 text-white">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-white/75">{detail}</p>
    </div>
  );
}
