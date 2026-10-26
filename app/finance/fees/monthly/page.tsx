import { redirect } from "next/navigation";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  p.set("tab", "fees");
  if (sp.month) p.set("month", sp.month);
  if (sp.year) p.set("year", sp.year);
  redirect(`/finance/income-vs-expenses?${p.toString()}`);
}
