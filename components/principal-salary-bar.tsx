"use client";

import Link from "next/link";
import { useState } from "react";

export function PrincipalSalaryBar({
  month,
  year,
  periodLabel,
}: {
  month: number;
  year: number;
  periodLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#0b1f3a]/15 bg-gradient-to-r from-[#0b1f3a] via-[#102d52] to-[#0b1f3a] p-4 text-white shadow-md transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl backdrop-blur-xs">
            💳
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black tracking-wide text-white truncate">Disburse Salaries · Pay Salary Bar</h2>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 shrink-0">
                {periodLabel}
              </span>
            </div>
            <p className="text-[11px] text-white/70 line-clamp-1 sm:line-clamp-none">
              Click below to disburse salaries or view payment vouchers for staff categories:
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90 hover:bg-white/20 transition cursor-pointer"
        >
          {isOpen ? "Hide Quick Links ↑" : "Open Quick Links ↓"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 pt-3 border-t border-white/10 animate-fadeIn">
          {/* 1. Teachers Salary Quick Link */}
          <Link
            href={`/principal/salaries?type=teachers&month=${month}&year=${year}`}
            className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 transition-all hover:bg-white/15 hover:border-white/25 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">👨‍🏫</span>
              <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                Faculty
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-black text-white group-hover:text-sky-200 transition-colors">
                Teachers Salary →
              </h3>
              <p className="mt-0.5 text-[11px] text-white/60">
                Disburse academic faculty monthly pay
              </p>
            </div>
          </Link>

          {/* 2. Finance Staff Salary Quick Link */}
          <Link
            href={`/principal/salaries?type=finance&month=${month}&year=${year}`}
            className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 transition-all hover:bg-white/15 hover:border-white/25 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">💼</span>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                Executive Only
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-black text-white group-hover:text-emerald-200 transition-colors">
                Finance Staff Salary →
              </h3>
              <p className="mt-0.5 text-[11px] text-white/60">
                Principal exclusive authorization
              </p>
            </div>
          </Link>

          {/* 3. Other Employees Salary Quick Link */}
          <Link
            href={`/principal/salaries?type=employees&month=${month}&year=${year}`}
            className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 transition-all hover:bg-white/15 hover:border-white/25 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">🔧</span>
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                Operations
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-black text-white group-hover:text-amber-200 transition-colors">
                Other Employees Salary →
              </h3>
              <p className="mt-0.5 text-[11px] text-white/60">
                Drivers, Peons, Guards & Support
              </p>
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}

