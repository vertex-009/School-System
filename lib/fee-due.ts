import { MONTHS } from "@/lib/format";

/** Minimal invoice shape for due / breakdown math. */
export type FeeDueInvoice = {
  id?: string;
  month: number;
  year: number;
  amount: number;
  discount?: number | null;
  paid_amount?: number | null;
  status: string;
};

export type FeeDueLine = {
  id?: string;
  month: number;
  year: number;
  label: string;
  due: number;
  status: string;
};

export type FeeDueSummary = {
  lines: FeeDueLine[];
  totalDue: number;
};

function periodKey(month: number, year: number) {
  return year * 12 + month;
}

/** due = amount - discount - paid_amount; only unpaid/partial contribute. */
export function invoiceDue(inv: FeeDueInvoice): number {
  if (inv.status !== "unpaid" && inv.status !== "partial") return 0;
  const due =
    Number(inv.amount) - Number(inv.discount || 0) - Number(inv.paid_amount || 0);
  return Math.max(due, 0);
}

/**
 * Month breakdown + total due for open invoices.
 * Optional throughMonth/throughYear caps which months are included (inclusive).
 * Optional fromMonth/fromYear skips months before admission / join (inclusive).
 * Lines sorted oldest → newest (default pay focus = first line).
 */
export function feeDueBreakdown(
  invoices: FeeDueInvoice[],
  opts?: {
    throughMonth?: number;
    throughYear?: number;
    fromMonth?: number;
    fromYear?: number;
  }
): FeeDueSummary {
  let list = [...invoices];
  if (opts?.fromMonth != null && opts?.fromYear != null) {
    const from = periodKey(opts.fromMonth, opts.fromYear);
    list = list.filter((inv) => periodKey(inv.month, inv.year) >= from);
  }
  if (opts?.throughMonth != null && opts?.throughYear != null) {
    const through = periodKey(opts.throughMonth, opts.throughYear);
    list = list.filter((inv) => periodKey(inv.month, inv.year) <= through);
  }

  list.sort((a, b) => periodKey(a.month, a.year) - periodKey(b.month, b.year));

  const lines: FeeDueLine[] = [];
  for (const inv of list) {
    const due = invoiceDue(inv);
    if (due <= 0) continue;
    lines.push({
      id: inv.id,
      month: inv.month,
      year: inv.year,
      label: `${MONTHS[(inv.month || 1) - 1]} ${inv.year}`,
      due,
      status: inv.status,
    });
  }

  const totalDue = lines.reduce((s, l) => s + l.due, 0);
  return { lines, totalDue };
}
