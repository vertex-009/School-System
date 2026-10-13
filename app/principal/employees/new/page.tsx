import Link from "next/link";
import { OtherEmployeeForm } from "@/app/finance/employees/form";
import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PrincipalAddOtherEmployeePage() {
  const { profile, schoolId } = await getContext();
  if (profile.role !== "principal" || !schoolId) redirect("/");

  return (
    <Shell role="principal" title="Add other employee">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Driver, peon, guard — salary only. Pay is done by Finance.</p>
        <Link href="/principal/employees" className="text-xs font-bold text-brand-accent hover:underline">
          View employees →
        </Link>
      </div>
      <OtherEmployeeForm />
    </Shell>
  );
}
