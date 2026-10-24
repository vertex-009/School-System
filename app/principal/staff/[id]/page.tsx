import Link from "next/link";
import { setStaffActive } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { StaffProfileCard } from "@/components/staff-profile-card";
import { Back } from "@/components/ui";
import { EditStaffProfileForm } from "@/components/edit-staff-profile-form";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FinanceStaffDetailPage({
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

  const [{ data: staff }, { data: salaryRec }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, phone, is_active, cnic, photo_url, role, joined_on, created_at")
      .eq("id", id)
      .eq("school_id", schoolId)
      .eq("role", "finance")
      .maybeSingle(),
    supabase
      .from("teacher_salaries")
      .select("monthly_salary")
      .eq("school_id", schoolId)
      .eq("teacher_id", id)
      .maybeSingle(),
  ]);

  if (!staff) redirect("/principal/staff");

  const showEdit = edit === "1" && !readOnly;

  return (
    <Shell role="principal" title="Finance profile">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Back href="/principal/staff" label="← Back to Finance Staff" />
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <form action={setStaffActive.bind(null, staff.id, !staff.is_active)}>
                <button
                  className={`rounded-xl px-4 py-2 text-sm font-bold shadow-xs transition ${
                    staff.is_active
                      ? "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                  }`}
                >
                  {staff.is_active ? "Suspend" : "Activate"}
                </button>
              </form>
            )}
            {!readOnly &&
              (!showEdit ? (
                <Link
                  href={`/principal/staff/${staff.id}?edit=1`}
                  className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent shadow-xs transition"
                >
                  Edit profile
                </Link>
              ) : (
                <Link href={`/principal/staff/${staff.id}`} className="self-center text-xs font-bold text-brand-accent hover:underline">
                  View profile
                </Link>
              ))}
          </div>
        </div>

        <StaffProfileCard
          staff={{
            name: staff.name,
            role: "finance",
            email: staff.email,
            phone: staff.phone,
            cnic: staff.cnic,
            is_active: staff.is_active,
            photo_url: staff.photo_url,
            joined_on: staff.joined_on || staff.created_at,
            monthly_salary: salaryRec?.monthly_salary != null ? Number(salaryRec.monthly_salary) : null,
          }}
        />

        {showEdit && (
          <EditStaffProfileForm
            title="Edit finance profile"
            subtitle="Name, phone, and CNIC. Form preserves all inputs on error."
            profile={{
              id: staff.id,
              name: staff.name,
              email: staff.email,
              phone: staff.phone,
              cnic: staff.cnic,
            }}
          />
        )}
      </div>
    </Shell>
  );
}
