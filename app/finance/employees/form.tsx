"use client";

import { useActionState } from "react";
import { saveOtherEmployee } from "@/lib/actions";
import { Card, Field, Select } from "@/components/ui";

const JOBS = ["Driver", "Peon", "Guard", "Cleaner", "Gardener", "Cook", "Clerk", "Other"];

export function OtherEmployeeForm() {
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => saveOtherEmployee(fd), null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card title="Add other employee" subtitle="Join date is required — salary shows from that month until leave/suspend">
      {state?.ok && (
        <p className="mb-3 text-sm font-bold text-emerald-700">Employee saved. Pay from Other employees → Pay salary.</p>
      )}
      {state?.error && <p className="mb-3 text-sm font-bold text-rose-600">{state.error}</p>}

      <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Full name" name="name" required />
        <Select label="Job title" name="job_title" required defaultValue="Driver">
          {JOBS.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </Select>
        <Field label="Join / entry date" name="joined_on" type="date" required defaultValue={today} />
        <Field label="Phone (optional)" name="phone" />
        <Field label="CNIC (optional)" name="cnic" placeholder="12345-1234567-1" />
        <Field label="Monthly salary (PKR)" name="monthly_salary" type="number" min={0} defaultValue={0} required />
        <div className="self-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60"
          >
            {pending ? "Saving…" : "Add employee"}
          </button>
        </div>
      </form>
    </Card>
  );
}
