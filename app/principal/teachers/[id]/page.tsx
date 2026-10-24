import Link from "next/link";
import { setTeacherActive } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { StaffProfileCard } from "@/components/staff-profile-card";
import { Back } from "@/components/ui";
import { EditStaffProfileForm } from "@/components/edit-staff-profile-form";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");

  const [{ data: teacher }, { data: salaryRec }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, phone, is_active, cnic, photo_url, role, joined_on, created_at")
      .eq("id", id)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .maybeSingle(),
    supabase
      .from("teacher_salaries")
      .select("monthly_salary")
      .eq("school_id", schoolId)
      .eq("teacher_id", id)
      .maybeSingle(),
  ]);

  if (!teacher) redirect("/principal/teachers");

  const showEdit = edit === "1" && !readOnly;

  return (
    <Shell role="principal" title="Teacher profile">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Back href="/principal/teachers" label="← Back to Teachers" />
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <form action={setTeacherActive.bind(null, teacher.id, !teacher.is_active)}>
                <button
                  className={`rounded-xl px-4 py-2 text-sm font-bold shadow-xs transition ${
                    teacher.is_active
                      ? "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                  }`}
                >
                  {teacher.is_active ? "Suspend" : "Activate"}
                </button>
              </form>
            )}
            {!readOnly &&
              (!showEdit ? (
                <Link
                  href={`/principal/teachers/${teacher.id}?edit=1`}
                  className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent shadow-xs transition"
                >
                  Edit profile
                </Link>
              ) : (
                <Link href={`/principal/teachers/${teacher.id}`} className="self-center text-xs font-bold text-brand-accent hover:underline">
                  View profile
                </Link>
              ))}
          </div>
        </div>

        <StaffProfileCard
          staff={{
            name: teacher.name,
            role: "teacher",
            email: teacher.email,
            phone: teacher.phone,
            cnic: teacher.cnic,
            is_active: teacher.is_active,
            photo_url: teacher.photo_url,
            joined_on: teacher.joined_on || teacher.created_at,
            monthly_salary: salaryRec?.monthly_salary != null ? Number(salaryRec.monthly_salary) : null,
          }}
        />

        {showEdit && (
          <EditStaffProfileForm
            title="Edit teacher"
            subtitle="Name, phone, and CNIC. Form preserves all inputs on error."
            profile={{
              id: teacher.id,
              name: teacher.name,
              email: teacher.email,
              phone: teacher.phone,
              cnic: teacher.cnic,
            }}
          />
        )}
      </div>
    </Shell>
  );
}
