import Link from "next/link";
import { Shell } from "@/components/shell";

export default function PrincipalOtherEmployeesHubPage() {
  return (
    <Shell role="principal" title="Other employees">
      <div className="space-y-5">
        {/* Top Header Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#1a5276]/30 bg-gradient-to-r from-[#0b1f3a] via-[#102d54] to-[#1a5276] p-6 sm:p-7 text-white shadow-[0_4px_20px_rgba(11,31,58,0.15)]">
          <div className="relative z-[1] max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Principal Portal · Staff & Administration
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Employee Management
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-300">
              Manage school administrative personnel, support staff, and monthly salary records.
            </p>
          </div>
        </section>

        {/* Action Boxes */}
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
            {/* 1. Add Employee */}
            <Link
              href="/principal/employees/new"
              className="group relative flex flex-col justify-between rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 transition group-hover:bg-amber-500 group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-amber-800">
                  Add Employee
                </h3>
              </div>
            </Link>

            {/* 2. View Employees */}
            <Link
              href="/principal/employees"
              className="group relative flex flex-col justify-between rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1f3a] text-white shadow-md shadow-slate-900/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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
                  View Employees
                </h3>
              </div>
            </Link>
          </div>
      </div>
    </Shell>
  );
}
