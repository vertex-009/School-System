"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { payOtherEmployeeSalary } from "@/lib/actions";
import { Card, Field, Select } from "@/components/ui";
import { MONTHS, pkr } from "@/lib/format";

type Emp = { id: string; name: string; job_title: string; monthly_salary: number };

export function PayOtherEmployeeForm({
  employees,
  paidIds,
  month,
  year,
  periodLabel,
}: {
  employees: Emp[];
  paidIds: string[];
  month: number;
  year: number;
  periodLabel: string;
}) {
  const [extraPaid, setExtraPaid] = useState<string[]>([]);
  const paid = useMemo(() => new Set([...paidIds, ...extraPaid]), [paidIds, extraPaid]);
  const [pick, setPick] = useState(employees[0]?.id || "");

  const selected = employees.find((e) => e.id === pick);

  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => {
    fd.set("month", String(month));
    fd.set("year", String(year));
    fd.set("employee_id", pick);
    return payOtherEmployeeSalary(fd);
  }, null);

  useEffect(() => {
    if (state?.ok && pick) {
      setExtraPaid((prev) => (prev.includes(pick) ? prev : [...prev, pick]));
    }
  }, [state, pick]);

  useEffect(() => {
    if (!employees.some((e) => e.id === pick)) {
      setPick(employees[0]?.id || "");
    }
  }, [employees, pick]);

  const alreadyPaid = Boolean(pick && paid.has(pick));
  const amount = selected?.monthly_salary || 0;

  return (
    <Card
      title="Pay other employee"
      subtitle={`Salary will be recorded for ${periodLabel} — month & year are required.`}
    >
      <div className="mb-4 rounded-xl border border-brand-sky/40 bg-brand-soft px-4 py-3 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Paying for month</p>
        <p className="mt-0.5 text-lg font-black text-brand-navy">{periodLabel}</p>
        <p className="mt-1 text-xs text-slate-500">Change month / year above, then Show — then pay.</p>
      </div>

      {state?.ok && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          Paid for {periodLabel}
          {state.receipt ? ` · ${state.receipt}` : ""}.
        </div>
      )}
      {state?.error && !alreadyPaid && (
        <p className="mb-3 text-sm font-bold text-rose-600">{state.error}</p>
      )}

      <form action={action} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />

        <Select label="Employee" required value={pick} onChange={(e) => setPick(e.target.value)}>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.job_title}) · {pkr(e.monthly_salary)}
              {paid.has(e.id) ? " · Already paid" : ""}
            </option>
          ))}
        </Select>
        <Field
          key={`amt-${pick}-${month}-${year}`}
          label="Amount (PKR)"
          name="amount"
          type="number"
          min={1}
          defaultValue={amount || ""}
          required
          disabled={alreadyPaid}
        />
        <label className="text-xs font-bold text-slate-600">
          Salary month
          <input
            readOnly
            value={MONTHS[month - 1] || "—"}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-navy"
          />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Year
          <input
            readOnly
            value={String(year)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-navy"
          />
        </label>
        <Select label="Method" name="method" defaultValue="cash" disabled={alreadyPaid}>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="jazzcash">JazzCash</option>
          <option value="easypaisa">Easypaisa</option>
        </Select>
        <div className="self-end">
          {alreadyPaid ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900">
              Already paid · {selected?.name || "Employee"} · {periodLabel}
            </p>
          ) : (
            <button
              type="submit"
              disabled={pending || !pick}
              className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60"
            >
              {pending ? "Paying…" : `Pay salary · ${periodLabel}`}
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
