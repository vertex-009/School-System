"use client";

import { useState } from "react";
import Link from "next/link";
import { createTeacher } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back, Card, Field } from "@/components/ui";
import { CnicField } from "@/components/cnic-field";
import { CredentialSuccessModal } from "@/components/credential-success-modal";

export default function FinanceAddTeacherPage() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    name?: string;
    email?: string;
    password?: string;
    error?: string;
    field?: string;
  } | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cnic: "",
    phone: "",
    joined_on: new Date().toISOString().slice(0, 10),
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
      const res = await createTeacher(fd);
      if (res?.ok) {
        setResult(res);
        setFormData({
          name: "",
          email: "",
          password: "",
          cnic: "",
          phone: "",
          joined_on: new Date().toISOString().slice(0, 10),
        });
        setPreview(null);
      } else {
        setResult({
          error: res?.error || "Failed to create teacher",
          field: res?.field || (res?.error?.toLowerCase().includes("cnic") ? "cnic" : undefined),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setResult({
        error: msg,
        field: msg.toLowerCase().includes("cnic") ? "cnic" : msg.toLowerCase().includes("email") ? "email" : undefined,
      });
    } finally {
      setPending(false);
    }
  };

  const isCnicError = result?.field === "cnic" || (Boolean(result?.error) && result?.error?.toLowerCase().includes("cnic"));
  const isEmailError = result?.field === "email" || (Boolean(result?.error) && result?.error?.toLowerCase().includes("email"));

  return (
    <Shell role="finance" title="Add teacher">
      <div className="flex items-center gap-3">
        <Back href="/finance/teachers" label="← Teachers" />
        <span className="text-slate-300">/</span>
        <Back href="/finance/teachers/list" label="View teachers" />
      </div>

      {result?.ok && (
        <CredentialSuccessModal
          roleTitle="Teacher"
          name={result.name || "Teacher"}
          email={result.email || ""}
          password={result.password}
          directoryHref="/finance/teachers/list"
          directoryLabel="View Teachers List"
          onClose={() => setResult(null)}
        />
      )}

      {result?.ok && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm animate-fadeIn">
          <p className="font-bold text-emerald-900">✓ Teacher account created successfully!</p>
          <p className="mt-1 text-xs text-emerald-800">
            <strong>Login credentials:</strong> {result.name} · {result.email} · {result.password}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <Link href="/finance/teachers/list" className="font-bold text-brand-accent hover:underline">
              View teachers list →
            </Link>
            <button
              type="button"
              onClick={() => setResult((prev) => ({ ...prev }))}
              className="font-semibold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
            >
              Reopen Credentials Window
            </button>
          </div>
        </div>
      )}

      {/* General error banner only if not field-specific */}
      {result?.error && !isCnicError && !isEmailError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 animate-fadeIn">
          {result.error}
        </div>
      )}

      <Card title="New teacher" subtitle="Password is shown only once. Form keeps all entered values on error.">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <Field
            label="Name"
            name="name"
            required
            minLength={3}
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Muhammad Ali"
          />

          <Field
            label="Email / Gmail"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="teacher@example.com"
            error={isEmailError ? result?.error : undefined}
          />

          <Field
            label="Password"
            name="password"
            type="text"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            helper="Password for teacher portal login"
          />

          <CnicField
            label="CNIC (National ID Card)"
            name="cnic"
            required
            value={formData.cnic}
            onChange={handleCnicChange}
            error={isCnicError ? result?.error : undefined}
            helper="13 digits with dashes (e.g. 12345-1234567-1)"
          />

          <Field
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0300-1234567"
          />

          <Field
            label="Join / entry date"
            name="joined_on"
            type="date"
            required
            value={formData.joined_on}
            onChange={handleChange}
          />

          {/* ID Card photo upload */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600">
              ID Card photo / Document
              <span className="ml-1 text-[11px] font-normal text-slate-400">(Optional · JPG, PNG up to 2MB)</span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
                else setPreview(null);
              }}
              className="mt-1.5 block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-navy file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-brand-accent file:cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-2"
            />
            {preview && (
              <div className="mt-2.5 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="ID card preview"
                  className="h-20 w-32 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
                <span className="text-xs text-slate-500">Selected ID Card photo preview</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {pending ? "Saving…" : "Create teacher"}
            </button>
          </div>
        </form>
      </Card>
    </Shell>
  );
}

