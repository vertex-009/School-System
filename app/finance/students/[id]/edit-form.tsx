"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveStudent } from "@/lib/actions";
import { Card, Field, Select } from "@/components/ui";
import { CnicField } from "@/components/cnic-field";

interface ClassOption {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  name: string;
  father_name: string | null;
  cnic: string | null;
  guardian_phone: string | null;
  gender: string | null;
  dob: string | null;
  joined_on?: string | null;
  created_at?: string | null;
  address: string | null;
  admission_no: string;
  roll_no: number | null;
  status: string;
  admission_fee?: number | null;
  monthly_fee?: number | null;
  transport_fee?: number | null;
  misc_fee?: number | null;
  discount?: number | null;
}

export function EditStudentForm({
  student,
  classes,
  currentClassId,
}: {
  student: StudentData;
  classes: ClassOption[];
  currentClassId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    error?: string;
    field?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    id: student.id,
    name: student.name,
    father_name: student.father_name || "",
    cnic: student.cnic || "",
    guardian_phone: student.guardian_phone || "",
    gender: student.gender || "",
    dob: student.dob || "",
    joined_on: student.joined_on || (student.created_at ? student.created_at.slice(0, 10) : ""),
    address: student.address || "",
    admission_no: student.admission_no,
    roll_no: student.roll_no != null ? String(student.roll_no) : "",
    class_id: currentClassId,
    status: student.status,
    admission_fee: student.admission_fee != null ? String(student.admission_fee) : "",
    monthly_fee: student.monthly_fee != null ? String(student.monthly_fee) : "",
    transport_fee: student.transport_fee != null ? String(student.transport_fee) : "",
    misc_fee: student.misc_fee != null ? String(student.misc_fee) : "",
    discount: student.discount != null ? String(student.discount) : "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (result?.field === name) {
      setResult(null);
    }
  };

  const handleDigitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const digitsOnly = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
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
    fd.set("admission_no", formData.admission_no);
    fd.set("class_id", formData.class_id);
    fd.set("admission_fee", String(Number(formData.admission_fee) || 0));
    fd.set("monthly_fee", String(Number(formData.monthly_fee) || 0));
    fd.set("transport_fee", String(Number(formData.transport_fee) || 0));
    fd.set("misc_fee", String(Number(formData.misc_fee) || 0));
    fd.set("discount", String(Number(formData.discount) || 0));

    try {
      const res = await saveStudent(fd);
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
    <Card title="Edit student" subtitle="Update profile details. Form preserves your input on validation errors.">
      {result?.ok && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 animate-fadeIn">
          ✓ Student record updated successfully!
        </div>
      )}

      {result?.error && !isCnicError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 animate-fadeIn">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3.5 md:grid-cols-2">
        <input type="hidden" name="id" value={formData.id} />

        <Field
          label="Name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
        />

        <Field
          label="Father name"
          name="father_name"
          value={formData.father_name}
          onChange={handleChange}
        />

        {/* CNIC field with auto-dashes, 13-digit validation & duplicate error highlight */}
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
          label="Guardian phone"
          name="guardian_phone"
          value={formData.guardian_phone}
          onChange={handleChange}
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
          label="Admission date"
          name="joined_on"
          type="date"
          value={formData.joined_on}
          onChange={handleChange}
        />

        <Field
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />

        <Field
          label="Admission number"
          name="admission_no"
          required
          value={formData.admission_no}
          onChange={handleChange}
          error={result?.field === "admission_no" ? result.error : undefined}
        />

        <Field
          label="Roll number"
          name="roll_no"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.roll_no}
          onChange={handleDigitChange}
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

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="active">Active</option>
          <option value="left">Left</option>
        </Select>

        {/* Fee & Discount Section: Clean digit boxes with no stepper dropdown arrows */}
        <div className="md:col-span-2 pt-3 border-t border-slate-200/90">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs shadow-xs">
              💳
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Fee &amp; Concessions
              </h3>
              <p className="text-[11px] text-slate-500">
                Update individual student fee amounts and monthly discount
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
            <Field
              label="Admission fee (PKR)"
              name="admission_fee"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={formData.admission_fee}
              onChange={handleDigitChange}
            />
            <Field
              label="Monthly tuition (PKR)"
              name="monthly_fee"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={formData.monthly_fee}
              onChange={handleDigitChange}
            />
            <Field
              label="Transport fee (PKR)"
              name="transport_fee"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={formData.transport_fee}
              onChange={handleDigitChange}
            />
            <Field
              label="Misc charges (PKR)"
              name="misc_fee"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={formData.misc_fee}
              onChange={handleDigitChange}
            />
            <Field
              label="Monthly discount (PKR)"
              name="discount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={formData.discount}
              onChange={handleDigitChange}
            />
          </div>
        </div>

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

