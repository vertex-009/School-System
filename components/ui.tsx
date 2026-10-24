import Link from "next/link";

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-100/80 bg-white p-5 shadow-card">
      {title && <h2 className="text-lg font-bold text-brand-navy">{title}</h2>}
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    helper?: string;
  }
) {
  const { label, className, error, helper, ...rest } = props;
  const isErr = Boolean(error);
  return (
    <label className="block text-xs font-bold text-slate-600">
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {rest.required && <span className="text-rose-500 font-bold text-sm leading-none select-none" title="Required">•</span>}
      </div>
      <input
        {...rest}
        className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none transition ${
          isErr
            ? "border-rose-400 bg-rose-50/30 text-rose-950 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/30"
            : "border-slate-200 bg-slate-50 focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
        } ${className || ""}`}
      />
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      {!error && helper && <p className="mt-1 text-[11px] text-slate-400">{helper}</p>}
    </label>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const { label, children, ...rest } = props;
  return (
    <label className="block text-xs font-bold text-slate-600">
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {rest.required && <span className="text-rose-500 font-bold text-sm leading-none select-none" title="Required">•</span>}
      </div>
      <select
        {...rest}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/40"
      >
        {children}
      </select>
    </label>
  );
}

export { Submit } from "@/components/submit-button";

export function Back({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-xs font-bold text-brand-accent hover:underline">
      {label}
    </Link>
  );
}
