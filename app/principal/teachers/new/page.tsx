"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTeacher } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back, Card, Field } from "@/components/ui";

export default function AddTeacherPage() {
  const [state, action, pending] = useActionState(async (_: unknown, formData: FormData) => createTeacher(formData), null);

  return (
    <Shell role="principal" title="Add teacher">
      <Back href="/principal/teachers" label="← View teachers" />

      {state?.ok && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-bold text-emerald-900">Give this login once</p>
          <p className="mt-1">
            {state.name} · {state.email} · {state.password}
          </p>
          <Link href="/principal/teachers" className="mt-2 inline-block text-xs font-bold text-brand-accent hover:underline">
            View teachers →
          </Link>
        </div>
      )}
      {state?.error && <p className="text-sm font-bold text-rose-600">{state.error}</p>}

      <Card title="New teacher" subtitle="Password is shown only once.">
        <form action={action} className="grid gap-3 md:grid-cols-2">
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
              {pending ? "Saving…" : "Create teacher"}
            </button>
          </div>
        </form>
      </Card>
    </Shell>
  );
}
