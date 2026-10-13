"use client";

import { useActionState, useMemo, useState } from "react";
import { changeLoggedInPassword, updateProfile } from "@/lib/actions";
import { ShellStandalone, type ShellRole } from "@/components/shell";
import { Card, Field } from "@/components/ui";
import type { Role } from "@/lib/session";

function shellRoleFor(role: Role): ShellRole {
  if (role === "principal" || role === "finance" || role === "teacher") return role;
  return "finance";
}

export function ProfileForm({
  role,
  name,
  phone,
  email,
  photoUrl,
}: {
  role: Role;
  name: string;
  phone: string;
  email: string;
  photoUrl: string | null;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    async (_: unknown, formData: FormData) => updateProfile(formData),
    null
  );
  const [pwState, pwAction, pwPending] = useActionState(changeLoggedInPassword, null);
  const [preview, setPreview] = useState<string | null>(null);
  const shownPhoto = preview || photoUrl;
  const initials = useMemo(
    () =>
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || "")
        .join("") || "?",
    [name]
  );

  return (
    <ShellStandalone role={shellRoleFor(role)} title="My profile">
      <Card title="Account" subtitle="Update your photo, contact details, and password in one place.">
        <form action={profileAction} className="grid gap-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-navy text-white ring-2 ring-slate-100">
              {shownPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-bold">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-600">Profile photo</p>
              <p className="mt-0.5 text-xs text-slate-400">JPG or PNG, up to 2 MB. Same option for every staff role.</p>
              <input
                name="photo"
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-navy file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-brand-accent"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setPreview(null);
                    return;
                  }
                  const url = URL.createObjectURL(file);
                  setPreview(url);
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" name="email_display" defaultValue={email} disabled />
            <Field label="Role" name="role_display" defaultValue={role.replace("_", " ")} disabled className="capitalize" />
            <Field label="Name" name="name" defaultValue={name} required minLength={3} />
            <Field label="Phone" name="phone" defaultValue={phone} />
          </div>

          <button
            disabled={profilePending}
            className="w-fit rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60"
          >
            {profilePending ? "Saving…" : "Save profile"}
          </button>
          {profileState?.ok && <p className="text-sm font-bold text-emerald-700">Profile saved.</p>}
          {profileState?.error && <p className="text-sm font-bold text-rose-600">{profileState.error}</p>}
        </form>

        <div className="my-6 border-t border-slate-100" />

        <div>
          <h3 className="text-sm font-bold text-brand-navy">Update password</h3>
          <p className="mt-1 text-xs text-slate-500">Choose a new password (minimum 8 characters).</p>
          <form action={pwAction} className="mt-4 grid max-w-md gap-3">
            <Field label="New password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <Field
              label="Confirm password"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              disabled={pwPending}
              className="w-fit rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60"
            >
              {pwPending ? "Updating…" : "Update password"}
            </button>
          </form>
          {pwState?.ok && <p className="mt-3 text-sm font-bold text-emerald-700">{pwState.message}</p>}
          {pwState?.error && <p className="mt-3 text-sm font-bold text-rose-600">{pwState.error}</p>}
        </div>
      </Card>
    </ShellStandalone>
  );
}
