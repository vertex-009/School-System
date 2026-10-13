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

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <input
        {...rest}
        className={`mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40 ${className || ""}`}
      />
    </label>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const { label, children, ...rest } = props;
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
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
