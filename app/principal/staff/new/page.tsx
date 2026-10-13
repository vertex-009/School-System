"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createSchoolStaff } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back, Card, Field } from "@/components/ui";

export default function AddFinancePage() {
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => createSchoolStaff(formData), null);

  return (
    <Shell role="principal" title="Add finance">
      <Back href="/principal/staff" label="← Finance staff" />

      {state?.ok && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-bold text-emerald-900">Give this login once</p>
          <p className="mt-1">
            Finance · {state.name} · {state.email} · {state.password}
          </p>
          <Link href="/principal/staff" className="mt-2 inline-block text-xs font-bold text-brand-accent hover:underline">
            View finance staff →
          </Link>
        </div>
      )}
      {state?.error && <p className="text-sm font-bold text-rose-600">{state.error}</p>}

      <Card title="Add Finance account" subtitle="Fees, cash collect, salaries, expenses & reports.">
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="role" value="finance" />
          <Field label="Name" name="name" required minLength={3} />
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="text" required minLength={8} />
          <Field label="CNIC" name="cnic" required placeholder="12345-1234567-1" inputMode="numeric" />
          <Field label="Phone" name="phone" />
          <Field
            label="Join / entry date"
            name="joined_on"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <div className="md:col-span-2">
            <button disabled={pending} className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60">
              {pending ? "Creating…" : "Create Finance account"}
            </button>
          </div>
        </form>
      </Card>
    </Shell>
  );
}
