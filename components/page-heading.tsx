import { signOut } from "@/lib/actions";

export function PageHeading({
  title,
  actions,
}: {
  title: string;
  /** Right side (e.g. month search on principal dashboard). */
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-2.5 backdrop-blur md:px-5 print:hidden">
      <h1 className="text-base font-bold tracking-tight text-brand-navy md:text-lg">{title}</h1>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {actions}
        <form action={signOut} className="md:hidden">
          <button className="text-xs font-bold text-rose-600">Logout</button>
        </form>
      </div>
    </header>
  );
}
