import { parsePeriod } from "@/lib/period";
import { redirect } from "next/navigation";

export default async function CollectionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  redirect(`/finance/income-vs-expenses?tab=fees&month=${period.month}&year=${period.year}`);
}
