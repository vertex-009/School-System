"use client";

import Image from "next/image";
import { useActionState } from "react";
import { updatePassword } from "@/lib/actions";
import { SCHOOL } from "@/lib/brand";

export default function ResetPage() {
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => updatePassword(formData), null);
  return (
    <main className="auth-bg flex min-h-screen items-center justify-center p-4">
      <form action={action} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <Image src={SCHOOL.logoSrc} alt={SCHOOL.name} width={72} height={72} className="h-16 w-16 object-contain" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">{SCHOOL.name}</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-navy">Set new password</h1>
        </div>
        {state?.error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{state.error}</p>}
        <label className="block text-xs font-bold text-slate-600">
          New password
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky"
          />
        </label>
        <button disabled={pending} className="w-full rounded-2xl bg-brand-navy py-3.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60">
          {pending ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
