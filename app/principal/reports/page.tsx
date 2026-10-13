import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

const REPORTS = [
  { href: "/principal/students", title: "Students directory", desc: "Active student list by class" },
  { href: "/principal/results", title: "Exam results", desc: "Result sheets and print view" },
  { href: "/principal/teachers", title: "Faculty report", desc: "Teachers and status" },
  { href: "/principal/fees/overview", title: "Financial summary", desc: "Billed / collected / unpaid overview" },
  { href: "/principal/attendance", title: "Attendance", desc: "Daily class attendance view" },
  { href: "/principal/announcements", title: "Announcements log", desc: "School notices history" },
];

export default async function ReportsPage() {
  const { schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  return (
    <Shell role="principal" title="Reports">
      <Card title="School reports" subtitle="Principal / Owner — view links only.">
        <div className="grid gap-3 sm:grid-cols-2">
          {REPORTS.map((r) => (
            <Link key={r.href} href={r.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
              <p className="font-bold text-slate-900">{r.title}</p>
              <p className="mt-1 text-xs text-slate-500">{r.desc}</p>
            </Link>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
