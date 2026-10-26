import { redirect } from "next/navigation";

export default async function PrincipalMonthlyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  q.set("tab", "monthly");
  if (sp.month) q.set("month", sp.month);
  if (sp.year) q.set("year", sp.year);
  redirect(`/principal/fees/overview?${q.toString()}`);
}
