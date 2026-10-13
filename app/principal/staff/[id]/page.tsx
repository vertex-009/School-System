import Link from "next/link";
import { setStaffActive, updateStaffProfile } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { StaffProfileCard } from "@/components/staff-profile-card";
import { Back, Card, Field, Submit } from "@/components/ui";
import { MONTHS } from "@/lib/format";
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

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const period = `${MONTHS[month - 1]} ${year}`;

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, name, phone, is_active, cnic, photo_url, role")
    .eq("id", id)
    .eq("school_id", schoolId)
    .eq("role", "finance")
    .maybeSingle();

  if (!staff) redirect("/principal/staff");

  const [{ data: salary }, { data: payment }] = await Promise.all([
    supabase.from("teacher_salaries").select("monthly_salary").eq("teacher_id", id).eq("school_id", schoolId).maybeSingle(),
    supabase
      .from("salary_payments")
      .select("amount")
      .eq("teacher_id", id)
      .eq("school_id", schoolId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle(),
  ]);

  const showEdit = edit === "1" && !readOnly;

  return (
    <Shell role="principal" title="Finance profile">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/principal/staff" label="← Finance staff" />
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <form action={setStaffActive.bind(null, staff.id, !staff.is_active)}>
              <button
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  staff.is_active
                    ? "border border-amber-200 bg-amber-50 text-amber-900"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-900"
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
                className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent"
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
          phone: staff.phone,
          cnic: staff.cnic,
          is_active: staff.is_active,
          photo_url: staff.photo_url,
          monthly_salary: salary ? Number(salary.monthly_salary) : null,
          salary_status: payment ? "Paid" : "Unpaid",
          salary_paid_amount: payment ? Number(payment.amount) : null,
          period_label: period,
        }}
      />

      {showEdit && (
        <Card title="Edit finance profile" subtitle="Name, phone, CNIC. Salary is set by Finance.">
          <form
            action={async (fd) => {
              "use server";
              const r = await updateStaffProfile(fd);
              if (r?.error) throw new Error(r.error);
            }}
            className="grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={staff.id} />
            <Field label="Name" name="name" defaultValue={staff.name} required minLength={3} />
            <Field label="Phone" name="phone" defaultValue={staff.phone || ""} />
            <Field label="CNIC" name="cnic" defaultValue={staff.cnic || ""} required placeholder="12345-1234567-1" inputMode="numeric" />
            <div className="md:col-span-2">
              <Submit>Save</Submit>
            </div>
          </form>
        </Card>
      )}
    </Shell>
  );
}
