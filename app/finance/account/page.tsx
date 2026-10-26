import { redirect } from "next/navigation";

export default async function FinanceMonthlyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  q.set("tab", "monthly");
  if (sp.month) q.set("month", sp.month);
  if (sp.year) q.set("year", sp.year);
  redirect(`/finance/income-vs-expenses?${q.toString()}`);
}
