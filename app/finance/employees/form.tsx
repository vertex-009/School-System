"use client";

import { useState } from "react";
import { saveOtherEmployee } from "@/lib/actions";
import { Card, Field, Select } from "@/components/ui";
import { CnicField } from "@/components/cnic-field";

const JOBS = ["Driver", "Peon", "Guard", "Cleaner", "Gardener", "Cook", "Clerk", "Other"];

export function OtherEmployeeForm() {
  const today = new Date().toISOString().slice(0, 10);
  const [pending, setPending] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [result, setResult] = useState<{
    ok?: boolean;
    error?: string;
    field?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    job_title: "Driver",
    joined_on: today,
    email: "",
    phone: "",
    cnic: "",
    monthly_salary: 25000,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "monthly_salary" ? Number(value) : value,
    }));
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
    const finalJobTitle = formData.job_title === "Other" ? (customJobTitle.trim() || "Other") : formData.job_title;
    fd.set("job_title", finalJobTitle);

    try {
      const res = await saveOtherEmployee(fd);
      if (res?.ok) {
        setResult({ ok: true });
        setCustomJobTitle("");
        setFormData({
          name: "",
          job_title: "Driver",
          joined_on: today,
          email: "",
          phone: "",
          cnic: "",
          monthly_salary: 25000,
        });
      } else {
        setResult({
          error: res?.error || "Failed to save employee",
          field: res?.field || (res?.error?.toLowerCase().includes("cnic") ? "cnic" : undefined),
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
    <Card title="Add other employee" subtitle="Join date is required — salary shows from that month until leave/suspend. Form preserves values on error.">
      {result?.ok && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 animate-fadeIn">
          ✓ Employee saved successfully! You can record monthly salary payments in the Salaries section.
        </div>
      )}

      {result?.error && !isCnicError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 animate-fadeIn">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Full name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Aslam Khan"
        />

        <Select
          label="Job title"
          name="job_title"
          required
          value={formData.job_title}
          onChange={handleChange}
        >
          {JOBS.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </Select>

        {formData.job_title === "Other" && (
          <div className="animate-fadeIn">
            <Field
              label="Specify Other Job Title"
              name="custom_job_title"
              required
              value={customJobTitle}
              onChange={(e) => setCustomJobTitle(e.target.value)}
              placeholder="e.g. Electrician, Security Guard, Lab Assistant"
              helper="Enter the custom job title or role name"
            />
          </div>
        )}

        <Field
          label="Join / entry date"
          name="joined_on"
          type="date"
          required
          value={formData.joined_on}
          onChange={handleChange}
        />

        <Field
          label="Phone (optional)"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="0300-1234567"
        />

        <Field
          label="Email / Gmail (optional)"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="employee@example.com"
        />

        {/* CNIC with automatic dashes, 13-digit validation & duplicate error highlight */}
        <CnicField
          label="CNIC (National ID Card)"
          name="cnic"
          required={false}
          value={formData.cnic}
          onChange={handleCnicChange}
          error={isCnicError ? result?.error : undefined}
          helper="13 digits with dashes (e.g. 12345-1234567-1)"
        />

        <Field
          label="Monthly salary (PKR)"
          name="monthly_salary"
          type="number"
          min={0}
          required
          value={formData.monthly_salary}
          onChange={handleChange}
        />

        <div className="sm:col-span-2 lg:col-span-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {pending ? "Saving…" : "Add employee"}
          </button>
        </div>
      </form>
    </Card>
  );
}
