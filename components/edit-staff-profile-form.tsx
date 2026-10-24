"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStaffProfile } from "@/lib/actions";
import { Card, Field } from "@/components/ui";
import { CnicField } from "@/components/cnic-field";

interface EditStaffProfileFormProps {
  title: string;
  subtitle?: string;
  profile: {
    id: string;
    name: string;
    email?: string | null;
    phone: string | null;
    cnic: string | null;
  };
}

export function EditStaffProfileForm({ title, subtitle, profile }: EditStaffProfileFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    error?: string;
    field?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    id: profile.id,
    name: profile.name,
    phone: profile.phone || "",
    cnic: profile.cnic || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (result?.field === name) {
      setResult(null);
    }
  };

  const handleCnicChange = (formatted: string) => {
    setFormData((prev) => ({ ...prev, cnic: formatted }));
    if (result?.field === "cnic") {
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setResult(null);

    const fd = new FormData(e.currentTarget);
    fd.set("cnic", formData.cnic);

    try {
      const res = await updateStaffProfile(fd);
      if (res?.ok) {
        setResult({ ok: true });
        router.refresh();
      } else if (res?.error) {
        setResult({
          error: res.error,
          field: res.field || (res.error.toLowerCase().includes("cnic") ? "cnic" : undefined),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setResult({
        error: msg,
        field: msg.toLowerCase().includes("cnic") ? "cnic" : undefined,
      });
    } finally {
      setPending(false);
    }
  };

  const isCnicError = result?.field === "cnic" || (Boolean(result?.error) && result?.error?.toLowerCase().includes("cnic"));

  return (
    <Card title={title} subtitle={subtitle || "Form preserves all entered values if an error occurs."}>
      {result?.ok && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 animate-fadeIn">
          ✓ Profile updated successfully!
        </div>
      )}

      {result?.error && !isCnicError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 animate-fadeIn">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3.5 md:grid-cols-2">
        <input type="hidden" name="id" value={formData.id} />

        {profile.email && (
          <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-slate-500">Login Email / Gmail:</span>
            <span className="font-semibold text-brand-navy">{profile.email}</span>
            <span className="ml-auto text-[10px] text-slate-400">(Linked Auth Account)</span>
          </div>
        )}

        <Field
          label="Full Name"
          name="name"
          required
          minLength={3}
          value={formData.name}
          onChange={handleChange}
        />

        <Field
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="0300-1234567"
        />

        {/* CNIC field with auto-dashes, 13-digit validation & duplicate error highlight */}
        <CnicField
          label="CNIC (National ID Card)"
          name="cnic"
          required
          value={formData.cnic}
          onChange={handleCnicChange}
          error={isCnicError ? result?.error : undefined}
          helper="13 digits with dashes (e.g. 12345-1234567-1)"
          className="md:col-span-2"
        />

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {pending ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </form>
    </Card>
  );
}

