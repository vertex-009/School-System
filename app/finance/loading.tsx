export default function FinanceLoading() {
  return (
    <div className="w-full max-w-full min-w-0 animate-pulse">
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 md:px-8">
        <div className="h-5 w-32 rounded-md bg-slate-200/80" />
      </header>

      <div className="space-y-4 p-3 md:p-4 lg:px-5 lg:py-4">
        <div className="h-28 w-full rounded-2xl bg-slate-100/80" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100/80" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          <div className="h-64 rounded-2xl bg-slate-100/80" />
          <div className="h-64 rounded-2xl bg-slate-100/80" />
          <div className="h-64 rounded-2xl bg-slate-100/80" />
        </div>
      </div>
    </div>
  );
}

