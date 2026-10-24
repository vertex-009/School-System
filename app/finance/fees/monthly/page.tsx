import { redirect } from "next/navigation";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  if (sp.month) p.set("month", sp.month);
  if (sp.year) p.set("year", sp.year);
  const q = p.toString();
  redirect(`/finance/history${q ? `?${q}` : ""}`);
}

