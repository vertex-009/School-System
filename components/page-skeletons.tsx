/** Shared page-shaped loading UI — use from route loading.tsx files. */

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

function PageChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 md:px-8">
        <h1 className="text-lg font-bold tracking-tight text-brand-navy">{title}</h1>
      </header>
      <div className="space-y-4 p-4 md:p-8">{children}</div>
    </>
  );
}

/** List / fee-records / history style: filters + table rows. */
export function TableSkeleton({
  title,
  columns = 5,
  rows = 8,
  showChips = false,
}: {
  title: string;
  columns?: number;
  rows?: number;
  showChips?: boolean;
}) {
  return (
    <PageChrome title={title}>
      <div className="rounded-3xl border border-slate-100/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3">
          <Block className="h-10 w-36" />
          <Block className="h-10 w-28" />
          <Block className="h-10 w-20" />
        </div>
        {showChips && (
          <div className="mb-4 flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Block key={i} className="h-8 w-16 !rounded-full" />
            ))}
          </div>
        )}
        <div className="space-y-2">
          <div className="flex gap-3 border-b border-slate-100 pb-2">
            {Array.from({ length: columns }).map((_, i) => (
              <Block key={i} className="h-3 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-3 py-2">
              {Array.from({ length: columns }).map((_, c) => (
                <Block key={c} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </PageChrome>
  );
}

/** Collect / salaries / assign style: form fields + optional list. */
export function FormSkeleton({
  title,
  fields = 4,
  showList = true,
}: {
  title: string;
  fields?: number;
  showList?: boolean;
}) {
  return (
    <PageChrome title={title}>
      <div className="rounded-3xl border border-slate-100/80 bg-white p-5 shadow-sm">
        <Block className="mb-4 h-4 w-32" />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i}>
              <Block className="mb-1.5 h-3 w-16" />
              <Block className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Block className="mt-4 h-10 w-28" />
      </div>
      {showList && (
        <div className="rounded-3xl border border-slate-100/80 bg-white p-5 shadow-sm">
          <Block className="mb-4 h-4 w-24" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-slate-50 pb-3">
                <div className="flex-1 space-y-2">
                  <Block className="h-4 w-40" />
                  <Block className="h-3 w-56" />
                </div>
                <Block className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}
    </PageChrome>
  );
}

/** Transfer / overview: chips bar + table. */
export function ChipsTableSkeleton({ title }: { title: string }) {
  return (
    <PageChrome title={title}>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Block key={i} className="h-10 w-20" />
        ))}
      </div>
      <div className="rounded-3xl border border-slate-100/80 bg-white p-5 shadow-sm">
        <Block className="mb-4 h-4 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Block className="h-4 w-12" />
              <Block className="h-4 flex-1" />
              <Block className="h-4 w-24" />
              <Block className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </PageChrome>
  );
}

/** Timetable grid placeholder. */
export function TimetableSkeleton({ title }: { title: string }) {
  return (
    <PageChrome title={title}>
      <div className="mb-2 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Block key={i} className="h-8 w-16" />
        ))}
      </div>
      <div className="rounded-3xl border border-slate-100/80 bg-white p-5 shadow-sm">
        <Block className="mb-4 h-4 w-40" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 30 }).map((_, i) => (
            <Block key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </PageChrome>
  );
}

/** Stat tiles overview (fees overview). */
export function StatsSkeleton({ title }: { title: string }) {
  return (
    <PageChrome title={title}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-slate-50 p-4">
            <Block className="h-3 w-16" />
            <Block className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>
    </PageChrome>
  );
}
