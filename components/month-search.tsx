"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MONTHS } from "@/lib/format";
import type { Period } from "@/lib/period";
import { AnnouncementDot } from "@/components/announcement-dot";

/** Header month/year pill + role photo — auto updates on change (no Go). */
export function MonthSearch({
  period,
  photoUrl,
  name,
  basePath = "/principal",
  roleLabel = "Principal",
}: {
  period: Period;
  photoUrl?: string | null;
  name?: string | null;
  basePath?: string;
  roleLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(month: number, year: number) {
    if (month < 1 || month > 12 || year < 2000 || year > 2100) return;
    if (month === period.month && year === period.year) return;
    startTransition(() => {
      router.push(`${basePath}?month=${month}&year=${year}`);
    });
  }

  const initial = (name || roleLabel).trim().charAt(0).toUpperCase() || "P";

  return (
    <div className={`flex items-center gap-2.5 ${pending ? "opacity-70" : ""}`}>
      <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 shadow-sm">
        <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
        <select
          value={period.month}
          onChange={(e) => apply(Number(e.target.value), period.year)}
          className="cursor-pointer appearance-none border-0 bg-transparent py-0 pr-1 text-sm font-semibold text-brand-navy outline-none"
          aria-label="Month"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={period.year}
          onChange={(e) => apply(period.month, Number(e.target.value))}
          className="cursor-pointer appearance-none border-0 bg-transparent py-0 text-sm font-semibold text-brand-navy outline-none"
          aria-label="Year"
        >
          {Array.from({ length: 8 }, (_, i) => period.year - 3 + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <span className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 text-sm font-semibold text-slate-700 shadow-sm">
        <span className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full bg-sky-100 ring-1 ring-slate-200">
          {photoUrl ? (
            <Image src={photoUrl} alt="" fill className="object-cover" sizes="28px" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-brand-navy">
              {initial}
            </span>
          )}
        </span>
        {roleLabel}
      </span>

      <Link
        href={
          basePath.startsWith("/finance")
            ? "/finance/announcements"
            : basePath.startsWith("/teacher")
            ? "/teacher/announcements"
            : "/principal/announcements"
        }
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-brand-navy cursor-pointer"
        title="Announcements"
        aria-label="View announcements"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <AnnouncementDot className="absolute -top-0.5 -right-0.5" />
      </Link>
    </div>
  );
}
