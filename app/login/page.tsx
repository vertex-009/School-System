"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/lib/actions";
import { SCHOOL } from "@/lib/brand";

export default function LoginPage() {
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    // Success redirects server-side; only errors return here.
    return signIn(formData);
  }, null);

  return (
    <main className="auth-bg flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-card md:grid-cols-[1fr_1fr]">
        <aside className="relative hidden flex-col items-center justify-center bg-brand-navy px-10 py-14 text-white md:flex">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-sky">Staff portal</p>

          <div className="relative mt-8 h-44 w-44 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
            <Image
              src={SCHOOL.logoSrc}
              alt={SCHOOL.fullName}
              fill
              sizes="176px"
              className="object-cover object-center"
              priority
            />
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{SCHOOL.name}</h1>
            <p className="mt-1.5 text-sm text-slate-300">{SCHOOL.city}</p>
          </div>
        </aside>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
          <div className="mb-8 text-center md:text-left">
            <div className="mx-auto mb-5 flex flex-col items-center md:hidden">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-accent">Staff portal</p>
              <div className="relative mt-4 h-24 w-24 overflow-hidden rounded-xl ring-1 ring-slate-200">
                <Image src={SCHOOL.logoSrc} alt={SCHOOL.fullName} fill sizes="96px" className="object-cover object-center" priority />
              </div>
              <p className="mt-3 text-sm font-semibold text-brand-navy">{SCHOOL.name}</p>
            </div>
            <h2 className="text-2xl font-bold text-brand-navy">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-500">Enter your staff email and password to continue.</p>
          </div>

          <form action={action} className="space-y-4">
            {state && "error" in state && state.error && (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{state.error}</p>
            )}
            <label className="block text-xs font-bold text-slate-600">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
              />
            </label>
            <button
              disabled={pending}
              className="w-full rounded-xl bg-brand-navy py-3.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
            <Link href="/forgot-password" className="block text-center text-xs font-bold text-brand-accent hover:underline">
              Forgot password?
            </Link>
          </form>

          <p className="mt-10 text-center text-[11px] text-slate-400 md:text-left">
            {SCHOOL.fullName} · {SCHOOL.city}
          </p>
        </div>
      </div>
    </main>
  );
}
