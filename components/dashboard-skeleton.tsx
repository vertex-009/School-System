/** Instant shell while dashboard RSC loads — matches StatTiles + chart grid. */

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />;
}

export function DashboardSkeleton({
  title = "Dashboard",
  showIntro = false,
  wideRight = false,
}: {
  title?: string;
  showIntro?: boolean;
  /** Teacher-style: one narrow + one wide panel */
  wideRight?: boolean;
}) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 md:px-8">
        <h1 className="text-lg font-bold tracking-tight text-brand-navy">{title}</h1>
      </header>
      <div className="space-y-4 p-4 md:p-8">
        {showIntro && <Block className="h-16 w-full" />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-4">
              <Block className="h-3 w-20" />
              <Block className="mt-3 h-8 w-24" />
              <Block className="mt-2 h-2 w-16" />
            </div>
          ))}
        </div>

        {wideRight ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5">
              <Block className="mb-4 h-3 w-24" />
              <div className="space-y-3">
                <Block className="h-2 w-full" />
                <Block className="h-2 w-3/4" />
                <Block className="h-2 w-2/3" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 lg:col-span-2">
              <Block className="mb-4 h-3 w-28" />
              <Block className="h-40 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-5">
                <Block className="mb-4 h-3 w-28" />
                {i === 0 ? (
                  <div className="flex justify-center py-4">
                    <Block className="h-28 w-28 !rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Block className="h-2 w-full" />
                    <Block className="h-2 w-3/4" />
                    <Block className="h-2 w-2/3" />
                    <Block className="h-2 w-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
