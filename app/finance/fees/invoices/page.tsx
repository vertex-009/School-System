import { generateInvoices } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Select, Submit } from "@/components/ui";
import { MONTHS } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function GenerateInvoicesPage() {
  const { schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const period = parsePeriod();
  return (
    <Shell role="finance" title="Generate invoices">
      <Card
        title="Monthly invoices"
        subtitle="Current or past months only. Future months are blocked — browse history will show No history until data exists."
      >
        <form
          action={async (fd) => {
            "use server";
            const r = await generateInvoices(fd);
            if (r?.error) throw new Error(r.error);
          }}
          className="grid max-w-lg gap-3"
        >
          <Select label="Month" name="month" defaultValue={String(period.month)}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
          <Field label="Year" name="year" type="number" defaultValue={period.year} required />
          <Field label="Due day" name="due_day" type="number" min={1} max={28} defaultValue={10} required />
          <Submit>Generate</Submit>
        </form>
      </Card>
    </Shell>
  );
}
