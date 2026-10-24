import Link from "next/link";
import { Shell } from "@/components/shell";

export default function FinanceTeachersPage() {
  return (
    <Shell role="finance" title="Teachers">
      <div className="space-y-5">
        {/* Top Header Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#1a5276]/30 bg-gradient-to-r from-[#0b1f3a] via-[#102d54] to-[#1a5276] p-6 sm:p-7 text-white shadow-[0_4px_20px_rgba(11,31,58,0.15)]">
          <div className="relative z-[1] max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Finance Portal · Faculty Division
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Faculty Management
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-300">
              Manage school teaching faculty, onboard instructors, and view teacher directories.
            </p>
          </div>
        </section>

        {/* Action Boxes */}
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
            {/* 1. Add Teacher */}
            <Link
              href="/finance/teachers/new"
              className="group relative flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-emerald-700">
                  Add Teacher
                </h3>
              </div>
            </Link>

            {/* 2. View Teachers */}
            <Link
              href="/finance/teachers/list"
              className="group relative flex flex-col justify-between rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1f3a] text-white shadow-md shadow-slate-900/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-800 transition group-hover:bg-[#0b1f3a] group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-brand-accent">
                  View Teachers
                </h3>
              </div>
            </Link>
          </div>
      </div>
    </Shell>
  );
}

