"use client";

import { useEffect } from "react";
import Link from "next/link";

export function DashboardError({
  error,
  reset,
  homeHref,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-bold text-brand-navy">Dashboard failed to load</h2>
      <p className="max-w-lg text-sm text-slate-600">{error.message || "Unknown error"}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent"
        >
          Retry
        </button>
        <Link href={homeHref} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-brand-navy hover:bg-slate-50">
          Home
        </Link>
        <Link href="/login" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
          Login
        </Link>
      </div>
    </div>
  );
}
