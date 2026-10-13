"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { requestReset } from "@/lib/actions";
import { SCHOOL } from "@/lib/brand";

export default function ForgotPage() {
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    formData.set("origin", window.location.origin);
    return requestReset(formData);
  }, null);

  return (
    <main className="auth-bg flex min-h-screen items-center justify-center p-4">
      <form action={action} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <Image src={SCHOOL.logoSrc} alt={SCHOOL.name} width={72} height={72} className="h-16 w-16 object-contain" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">{SCHOOL.name}</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-navy">Forgot password</h1>
          <p className="mt-1 text-sm text-slate-500">We will email you a reset link.</p>
        </div>
        {state?.ok && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">Check your email for a reset link.</p>}
        {state?.error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{state.error}</p>}
        <label className="block text-xs font-bold text-slate-600">
          Email
          <input name="email" type="email" required className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky" />
        </label>
        <button disabled={pending} className="w-full rounded-2xl bg-brand-navy py-3.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60">
          {pending ? "Sending…" : "Send reset link"}
        </button>
        <Link href="/login" className="block text-center text-xs font-bold text-brand-accent hover:underline">
          Back to login
        </Link>
      </form>
    </main>
  );
}
