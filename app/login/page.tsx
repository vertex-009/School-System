"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { signIn } from "@/lib/actions";
import { SCHOOL } from "@/lib/brand";

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)sms_role=([^;]*)/);
      if (match && match[1]) {
        setActiveRole(decodeURIComponent(match[1]));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    // Success redirects server-side; only errors return here.
    return signIn(formData);
  }, null);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061528] p-4 text-slate-100 sm:p-6 lg:p-8">
      {/* Background ambient radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 h-[36rem] w-[36rem] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(93, 173, 226, 0.22) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 h-[36rem] w-[36rem] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(26, 82, 118, 0.3) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.1] bg-[#091b33]/90 p-8 shadow-[0_20px_60px_rgba(3,10,20,0.6)] backdrop-blur-xl sm:p-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5dade2] transition hover:text-white"
          >
            <span>← Back to overview</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5dade2]">
            Staff Portal
          </span>
        </div>

        {/* Brand Header */}
        <div className="mb-8 flex items-center gap-3 border-b border-white/[0.08] pb-6">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
            <Image
              src={SCHOOL.logoSrc}
              alt={SCHOOL.fullName}
              fill
              sizes="48px"
              className="object-cover object-center"
              priority
            />
          </span>
          <div>
            <h1 className="font-serif text-lg font-bold leading-snug text-white">
              {SCHOOL.fullName}
            </h1>
            <p className="text-[11px] font-semibold text-slate-400">
              {SCHOOL.city}
            </p>
          </div>
        </div>

        {/* Multi-tab / Active Session Switcher Alert */}
        {activeRole && (
          <div className="mb-6 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3.5 text-xs text-sky-200 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Session: <span className="capitalize text-white font-extrabold">{activeRole}</span>
              </span>
              <Link
                href="/"
                className="font-bold text-sky-300 underline hover:text-white shrink-0"
              >
                Go to Dashboard →
              </Link>
            </div>
            <p className="mt-1.5 text-[11px] text-sky-200/70">
              Sign in below with another account to switch roles.
            </p>
          </div>
        )}

        {/* Error Notification */}
        {state && "error" in state && state.error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300">
            <span className="text-base">⚠</span>
            <span>{state.error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="staff@schoolsms.com"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#061528]/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#5dade2] focus:bg-[#071930] focus:ring-2 focus:ring-[#5dade2]/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                prefetch={true}
                className="text-xs font-medium text-[#5dade2] transition hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#061528]/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#5dade2] focus:bg-[#071930] focus:ring-2 focus:ring-[#5dade2]/30"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4ba3e3] to-[#60b5ef] py-3.5 text-sm font-bold text-[#061528] shadow-[0_0_24px_rgba(93,173,226,0.35)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#061528] border-t-transparent" />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
