"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions";
import { SideNav } from "@/components/side-nav";
import type { ShellRole } from "@/components/shell";
import { SCHOOL } from "@/lib/brand";

export function MobileNav({ role }: { role: ShellRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="md:hidden print:hidden">
      {/* Sticky Mobile Top App Bar */}
      <nav className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#102d54] bg-[#0b1f3a] px-3.5 text-white shadow-md">
        {/* Left: 3 Horizontal Lines (Hamburger Menu Button) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95 cursor-pointer"
            aria-label="Open menu"
            title="Open navigation menu"
          >
            {/* 3 Horizontal lines icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* School Brand & Role in Top Bar */}
          <div className="flex items-center gap-2">
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/10">
              <Image src={SCHOOL.logoSrc} alt="" fill sizes="32px" className="object-cover object-center" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate text-white">{SCHOOL.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5dade2]">
                {role === "finance" ? "Finance Portal" : role === "teacher" ? "Teacher Portal" : "Principal Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Profile Link */}
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition"
          title="My Profile"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </nav>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[17.5rem] max-w-[85vw] flex-col overflow-hidden bg-[#071528] text-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header with Logo & Close Button */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 shrink-0 bg-[#0b1f3a]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/10">
              <Image src={SCHOOL.logoSrc} alt="" fill sizes="40px" className="object-cover object-center" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-snug truncate text-white">{SCHOOL.name}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5dade2]">
                {role === "finance" ? "Finance" : role === "teacher" ? "Teacher" : "Principal"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition cursor-pointer"
            aria-label="Close menu"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer Navigation List */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3 text-sm [scrollbar-width:thin]">
          <SideNav role={role} variant="side" onNavigate={() => setIsOpen(false)} />
        </nav>

        {/* Drawer Footer: Profile & Logout */}
        <div className="shrink-0 space-y-2 border-t border-white/10 p-3 bg-[#071528]">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>My profile</span>
          </Link>

          <form action={signOut}>
            <button
              className={
                role === "finance" || role === "teacher"
                  ? "w-full rounded-xl bg-[#8b1e2d] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#a02638] transition cursor-pointer shadow-sm active:scale-98"
                  : "w-full rounded-xl bg-gradient-to-r from-[#1a8cff] to-[#5dade2] px-3 py-2.5 text-sm font-bold text-white shadow-[0_0_12px_rgba(26,140,255,0.35)] hover:brightness-110 transition cursor-pointer active:scale-98"
              }
            >
              Logout
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

