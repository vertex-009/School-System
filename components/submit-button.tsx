"use client";

import { useFormStatus } from "react-dom";

/** Disables while the parent form’s server action is pending — stops double-add clicks. */
export function Submit({
  children,
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
