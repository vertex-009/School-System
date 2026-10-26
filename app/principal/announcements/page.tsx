import Link from "next/link";
import { Shell } from "@/components/shell";
import { AnnouncementDot } from "@/components/announcement-dot";

export default function PrincipalAnnouncementsPage() {
  return (
    <Shell role="principal" title="Announcements">
      <div className="space-y-5">
        {/* Top Header Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#1a5276]/30 bg-gradient-to-r from-[#0b1f3a] via-[#102d54] to-[#1a5276] p-6 sm:p-7 text-white shadow-[0_4px_20px_rgba(11,31,58,0.15)]">
          <div className="relative z-[1] max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-rose-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              Principal Portal · Communications
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Announcements Management
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-300">
              Publish school notices, broadcast circulars to staff, and inspect notice logs.
            </p>
          </div>
        </section>

        {/* Action Boxes */}
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
            {/* 1. Make Announcement */}
            <Link
              href="/principal/announcements/make"
              className="group relative flex flex-col justify-between rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-rose-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700 transition group-hover:bg-rose-600 group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-rose-700">
                  Make Announcement
                </h3>
              </div>
            </Link>

            {/* 2. Announcement History */}
            <Link
              href="/principal/announcements/history"
              className="group relative flex flex-col justify-between rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1f3a] text-white shadow-md shadow-slate-900/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-800 transition group-hover:bg-[#0b1f3a] group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-brand-accent">
                  Announcement History
                </h3>
                <AnnouncementDot />
              </div>
            </Link>
          </div>
      </div>
    </Shell>
  );
}
