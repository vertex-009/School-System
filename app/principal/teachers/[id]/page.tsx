import Link from "next/link";
import { updateStaffProfile } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { StaffProfileCard } from "@/components/staff-profile-card";
import { Back, Card, Field, Submit } from "@/components/ui";
import { MONTHS } from "@/lib/format";
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

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const period = `${MONTHS[month - 1]} ${year}`;

  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, name, phone, is_active, cnic, photo_url, role")
    .eq("id", id)
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .maybeSingle();

  if (!teacher) redirect("/principal/teachers");

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
    <Shell role="principal" title="Teacher profile">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/principal/teachers" label="← View teachers" />
        {!readOnly &&
          (!showEdit ? (
            <Link
              href={`/principal/teachers/${teacher.id}?edit=1`}
              className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent"
            >
              Edit profile
            </Link>
          ) : (
            <Link href={`/principal/teachers/${teacher.id}`} className="self-center text-xs font-bold text-brand-accent hover:underline">
              View profile
            </Link>
          ))}
      </div>

      <StaffProfileCard
        staff={{
          name: teacher.name,
          role: "teacher",
          phone: teacher.phone,
          cnic: teacher.cnic,
          is_active: teacher.is_active,
          photo_url: teacher.photo_url,
          monthly_salary: salary ? Number(salary.monthly_salary) : null,
          salary_status: payment ? "Paid" : "Unpaid",
          salary_paid_amount: payment ? Number(payment.amount) : null,
          period_label: period,
        }}
      />

      {showEdit && (
        <Card title="Edit teacher" subtitle="Name, phone, CNIC only. Salary is set by Finance.">
          <form
            action={async (fd) => {
              "use server";
              const r = await updateStaffProfile(fd);
              if (r?.error) throw new Error(r.error);
            }}
            className="grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={teacher.id} />
            <Field label="Name" name="name" defaultValue={teacher.name} required minLength={3} />
            <Field label="Phone" name="phone" defaultValue={teacher.phone || ""} />
            <Field label="CNIC" name="cnic" defaultValue={teacher.cnic || ""} required placeholder="12345-1234567-1" inputMode="numeric" />
            <div className="md:col-span-2">
              <Submit>Save</Submit>
            </div>
          </form>
        </Card>
      )}
    </Shell>
  );
}
