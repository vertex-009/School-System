"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveStudent } from "@/lib/actions";
import { Card, Field, Select } from "@/components/ui";
import { CnicField } from "@/components/cnic-field";

interface ClassItem {
  id: string;
  name: string;
  fee_structure?: { monthly_fee: number }[] | { monthly_fee: number } | null;
}

function getClassFee(cls?: ClassItem): string {
  if (!cls?.fee_structure) return "";
  if (Array.isArray(cls.fee_structure)) {
    const fee = cls.fee_structure[0]?.monthly_fee;
    return fee && Number(fee) > 0 ? String(fee) : "";
  }
  if (typeof cls.fee_structure === "object" && "monthly_fee" in cls.fee_structure) {
    const fee = (cls.fee_structure as { monthly_fee: number }).monthly_fee;
    return fee && Number(fee) > 0 ? String(fee) : "";
  }
  return "";
}

export function NewStudentForm({
  classes,
  role = "finance",
  defaultAdmissionNo = "",
}: {
  classes: ClassItem[];
  role?: "finance" | "principal";
  defaultAdmissionNo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    studentId?: string;
    error?: string;
    field?: string;
  } | null>(null);

  const initialClass = classes[0];
  const initialMonthlyFee = getClassFee(initialClass);

  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    cnic: "",
    guardian_phone: "",
    gender: "",
    dob: "",
    joined_on: new Date().toISOString().slice(0, 10),
    address: "",
    admission_no: defaultAdmissionNo,
    roll_no: "",
    class_id: initialClass?.id || "",
    status: "active",
    admission_fee: "",
    monthly_fee: initialMonthlyFee,
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

  const handleDigitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const digitsOnly = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
    if (result?.field === name) {
      setResult(null);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    const selectedClass = classes.find((c) => c.id === classId);
    const feeFromClass = getClassFee(selectedClass);
    setFormData((prev) => ({
      ...prev,
      class_id: classId,
      monthly_fee: (!prev.monthly_fee || prev.monthly_fee === "0") && feeFromClass ? feeFromClass : prev.monthly_fee,
    }));
    if (result?.field === "class_id") {
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

  const netMonthly = Math.max(
    0,
    (Number(formData.monthly_fee) || 0) +
      (Number(formData.transport_fee) || 0) +
      (Number(formData.misc_fee) || 0) -
      (Number(formData.discount) || 0)
  );

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
          placeholder="Residential address"
        />

        <Field
          label="Admission number"
          name="admission_no"
          required
          value={formData.admission_no}
          onChange={handleChange}
          placeholder="e.g. ADM-42"
          error={result?.field === "admission_no" ? result.error : undefined}
        />

        <Field
          label="Roll number (optional)"
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
          onChange={handleClassChange}
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        {/* Fee & Discount Section at admission time: Clean digit boxes with no stepper dropdown arrows */}
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

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-semibold">Calculated Net Monthly:</span>
            <span className="font-extrabold text-emerald-700 text-sm">
              Rs. {netMonthly.toLocaleString()}
            </span>
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
