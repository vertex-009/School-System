import { Shell } from "@/components/shell";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { ExpensesHubClient, type ExpenseItem } from "./expenses-hub-client";

export default async function SchoolExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { dayStart, dayEnd } = periodBounds(period.month, period.year);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: rows }, { data: school }] = await Promise.all([
    supabase
      .from("school_expenses")
      .select("id, title, category, amount, expense_date, note")
      .eq("school_id", schoolId)
      .eq("kind", "school")
      .gte("expense_date", dayStart)
      .lt("expense_date", dayEnd)
      .order("expense_date", { ascending: false }),
    supabase
      .from("schools")
      .select("name, address, phone")
      .eq("id", schoolId)
      .maybeSingle(),
  ]);

  const list = (rows || []) as ExpenseItem[];

  return (
    <Shell role="finance" title="Other expenses">
      <ExpensesHubClient
        period={period}
        expenses={list}
        school={school}
        financeName={profile.name?.trim() || "Finance"}
        defaultDate={period.isCurrent ? today : dayStart}
      />
    </Shell>
  );
}
