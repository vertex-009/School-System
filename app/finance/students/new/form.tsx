"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveStudent } from "@/lib/actions";
import { Card, Field, Select } from "@/components/ui";
import { CnicField } from "@/components/cnic-field";

interface ClassItem {
  id: string;
  name: string;
}

export function NewStudentForm({
  classes,
  role = "finance",
}: {
  classes: ClassItem[];
  role?: "finance" | "principal";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    studentId?: string;
    error?: string;
    field?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    cnic: "",
    guardian_phone: "",
    gender: "",
    dob: "",
    address: "",
    admission_no: "",
    roll_no: "",
    class_id: classes[0]?.id || "",
    status: "active",
    admission_fee: "",
    monthly_fee: "",
    transport_fee: "",
    misc_fee: "",
    discount: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const res = await saveStudent(fd);
      if (res?.ok && res.studentId) {
        if (role === "principal") {
          router.push(`/principal/students/${res.studentId}`);
        } else {
          router.push(`/finance/students/${res.studentId}`);
        }
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
    <Card title="New student">
      {result?.error && !isCnicError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 animate-fadeIn">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3.5 md:grid-cols-2">
        <Field
          label="Student Full Name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Ahmed Raza"
        />

        <Field
          label="Father Name"
          name="father_name"
          value={formData.father_name}
          onChange={handleChange}
          placeholder="e.g. Muhammad Raza"
        />

        {/* CNIC field with auto-dashes, 13-digit validation & duplicate check */}
        <CnicField
          label="CNIC / Form B"
          name="cnic"
          required
          value={formData.cnic}
          onChange={handleCnicChange}
          error={isCnicError ? result?.error : undefined}
          helper="13 digits (e.g. 12345-1234567-1)"
        />

        <Field
          label="Guardian Phone"
          name="guardian_phone"
          value={formData.guardian_phone}
          onChange={handleChange}
          placeholder="0300-1234567"
        />

        <Select
          label="Gender"
          name="gender"
          required
          value={formData.gender}
          onChange={handleChange}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </Select>

        <Field
          label="Date of birth"
          name="dob"
          type="date"
          value={formData.dob}
          onChange={handleChange}
        />

        <Field
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Residential address"
        />

        <Field
          label="Admission number"
          name="admission_no"
          required
          value={formData.admission_no}
          onChange={handleChange}
          placeholder="e.g. ADM-2024-001"
          error={result?.field === "admission_no" ? result.error : undefined}
        />

        <Field
          label="Roll number (optional)"
          name="roll_no"
          type="number"
          value={formData.roll_no}
          onChange={handleChange}
          placeholder="e.g. 15"
        />

        <Select
          label="Class"
          name="class_id"
          required
          value={formData.class_id}
          onChange={handleChange}
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        {/* Fee & Discount Section at admission time */}
        <div className="md:col-span-2 pt-3 border-t border-slate-200/90">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs shadow-xs">
              💳
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Fee &amp; Concessions (Set at Admission)
              </h3>
              <p className="text-[11px] text-slate-500">
                Set individual student fee rates and monthly discount (changeable later from student profile)
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
            <Field
              label="Admission fee (PKR)"
              name="admission_fee"
              type="number"
              min={0}
              placeholder="e.g. 5000"
              value={formData.admission_fee}
              onChange={handleChange}
            />
            <Field
              label="Monthly tuition (PKR)"
              name="monthly_fee"
              type="number"
              min={0}
              placeholder="e.g. 3500"
              value={formData.monthly_fee}
              onChange={handleChange}
            />
            <Field
              label="Transport fee (PKR)"
              name="transport_fee"
              type="number"
              min={0}
              placeholder="0"
              value={formData.transport_fee}
              onChange={handleChange}
            />
            <Field
              label="Misc charges (PKR)"
              name="misc_fee"
              type="number"
              min={0}
              placeholder="0"
              value={formData.misc_fee}
              onChange={handleChange}
            />
            <Field
              label="Monthly discount (PKR)"
              name="discount"
              type="number"
              min={0}
              placeholder="0"
              value={formData.discount}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* New students are always enrolled as active */}
        <input type="hidden" name="status" value="active" />

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {pending ? "Saving student…" : "Save student"}
          </button>
        </div>
      </form>
    </Card>
  );
}

