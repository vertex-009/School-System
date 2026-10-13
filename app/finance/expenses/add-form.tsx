"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSchoolExpense } from "@/lib/actions";
import { Card, Field, Select, Submit } from "@/components/ui";

const CATEGORIES = ["Utilities", "Rent", "Supplies", "Maintenance", "Transport", "Other"];

export function AddSchoolExpenseForm({ defaultDate }: { defaultDate: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const lock = useRef(false);
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => {
    const r = await addSchoolExpense(fd);
    return r;
  }, null);

  useEffect(() => {
    if (!pending) lock.current = false;
  }, [pending]);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card title="Add">
      {state?.ok && (
        <p className="mb-3 text-sm font-bold text-emerald-700">Expense added.</p>
      )}
      {state?.error && <p className="mb-3 text-sm font-bold text-rose-600">{state.error}</p>}
      <form
        ref={formRef}
        action={(fd) => {
          if (lock.current || pending) return;
          lock.current = true;
          action(fd);
        }}
        className="grid gap-3 md:grid-cols-2"
      >
        <input type="hidden" name="kind" value="school" />
        <Field label="Title" name="title" required />
        <Select label="Category" name="category" defaultValue="Utilities">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Field label="Amount" name="amount" type="number" min={1} required />
        <Field label="Date" name="expense_date" type="date" defaultValue={defaultDate} required />
        <div className="md:col-span-2">
          <Field label="Note" name="note" />
        </div>
        <div className="md:col-span-2">
          <Submit pendingLabel="Adding…">Add</Submit>
        </div>
      </form>
    </Card>
  );
}

export function AddOtherExpenseForm({ defaultDate }: { defaultDate: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const lock = useRef(false);
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => {
    const r = await addSchoolExpense(fd);
    return r;
  }, null);

  useEffect(() => {
    if (!pending) lock.current = false;
  }, [pending]);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card title="Add">
      {state?.ok && (
        <p className="mb-3 text-sm font-bold text-emerald-700">Payment added.</p>
      )}
      {state?.error && <p className="mb-3 text-sm font-bold text-rose-600">{state.error}</p>}
      <form
        ref={formRef}
        action={(fd) => {
          if (lock.current || pending) return;
          lock.current = true;
          action(fd);
        }}
        className="grid gap-3 md:grid-cols-2"
      >
        <input type="hidden" name="kind" value="other" />
        <Field label="Payee" name="title" required />
        <Field label="Purpose" name="purpose" required />
        <Field label="Amount" name="amount" type="number" min={1} required />
        <Field label="Date" name="expense_date" type="date" defaultValue={defaultDate} required />
        <div className="md:col-span-2">
          <Submit pendingLabel="Adding…">Add</Submit>
        </div>
      </form>
    </Card>
  );
}
