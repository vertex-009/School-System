"use client";

import { useActionState, useMemo, useState } from "react";
import { updateProfile } from "@/lib/actions";
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
      <Card title="Account" subtitle="Update your photo, contact details, email, and password in one place.">
        <form action={profileAction} className="grid gap-6 max-w-2xl">
          {/* Profile Photo */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-navy text-white ring-2 ring-slate-100 shadow-xs">
              {shownPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-bold">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-700">Profile photo</p>
              <p className="mt-0.5 text-xs text-slate-400">JPG or PNG, up to 2 MB. Same option for every staff role.</p>
              <input
                name="photo"
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 transition cursor-pointer"
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

          {/* Account & Contact Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" defaultValue={email} required />
            <Field label="Role" name="role_display" defaultValue={role.replace("_", " ")} disabled className="capitalize" />
            <Field label="Name" name="name" defaultValue={name} required minLength={3} />
            <Field label="Phone" name="phone" defaultValue={phone} />
          </div>

          {/* Password Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-brand-navy">Update password</h3>
              <p className="text-xs text-slate-500">Leave blank if you do not want to change your password.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="New password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
              />
              <Field
                label="Confirm password"
                name="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {/* Single Action Button at the bottom */}
          <div>
            <button
              disabled={profilePending}
              className="rounded-xl bg-brand-navy px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-accent disabled:opacity-60 transition cursor-pointer"
            >
              {profilePending ? "Updating profile…" : "Update profile"}
            </button>
          </div>

          {profileState?.ok && (
            <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 border border-emerald-200/60">
              {profileState.message || "Profile updated successfully."}
            </p>
          )}
          {profileState?.error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 border border-rose-200/60">
              {profileState.error}
            </p>
          )}
        </form>
      </Card>
    </ShellStandalone>
  );
}
