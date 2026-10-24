import { redirect } from "next/navigation";

/** History lives under Pay salary now. */
export default async function SalaryHistoryRedirect({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.month) q.set("month", sp.month);
  if (sp.year) q.set("year", sp.year);
  const qs = q.toString();
  redirect(`/finance/salaries/pay${qs ? `?${qs}` : ""}#history`);
}
