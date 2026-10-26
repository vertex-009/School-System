export function PageHeading({
  title,
  actions,
}: {
  title: string;
  /** Right side (e.g. month search on principal dashboard). */
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex w-full max-w-full flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 bg-white/95 px-3.5 py-2.5 backdrop-blur-md sm:px-4 md:px-5 print:hidden">
      <h1 className="text-base font-bold tracking-tight text-brand-navy sm:text-lg truncate max-w-[14rem] sm:max-w-none">
        {title}
      </h1>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}
