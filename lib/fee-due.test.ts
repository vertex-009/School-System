import { describe, expect, it } from "vitest";
import { feeDueBreakdown, invoiceDue } from "./fee-due";

describe("invoiceDue", () => {
  it("uses amount - discount - paid_amount for unpaid", () => {
    expect(
      invoiceDue({ month: 10, year: 2025, amount: 2000, discount: 200, paid_amount: 0, status: "unpaid" })
    ).toBe(1800);
  });

  it("includes remaining balance on partial rows", () => {
    expect(
      invoiceDue({ month: 10, year: 2025, amount: 2000, discount: 0, paid_amount: 500, status: "partial" })
    ).toBe(1500);
  });

  it("returns 0 for paid", () => {
    expect(
      invoiceDue({ month: 10, year: 2025, amount: 2000, discount: 0, paid_amount: 2000, status: "paid" })
    ).toBe(0);
  });
});

describe("feeDueBreakdown", () => {
  it("Student A: Oct paid, Nov unpaid → total = Nov only", () => {
    const summary = feeDueBreakdown(
      [
        { id: "a-oct", month: 10, year: 2025, amount: 2000, paid_amount: 2000, status: "paid" },
        { id: "a-nov", month: 11, year: 2025, amount: 2000, paid_amount: 0, status: "unpaid" },
      ],
      { throughMonth: 11, throughYear: 2025 }
    );
    expect(summary.lines.map((l) => l.label)).toEqual(["November 2025"]);
    expect(summary.totalDue).toBe(2000);
  });

  it("Student B: Oct unpaid + Nov unpaid → total = Oct + Nov", () => {
    const summary = feeDueBreakdown(
      [
        { id: "b-oct", month: 10, year: 2025, amount: 2000, paid_amount: 0, status: "unpaid" },
        { id: "b-nov", month: 11, year: 2025, amount: 2000, paid_amount: 0, status: "unpaid" },
      ],
      { throughMonth: 11, throughYear: 2025 }
    );
    expect(summary.lines.map((l) => `${l.label}:${l.due}`)).toEqual([
      "October 2025:2000",
      "November 2025:2000",
    ]);
    expect(summary.totalDue).toBe(4000);
    // Default pay focus = oldest unpaid
    expect(summary.lines[0]?.id).toBe("b-oct");
  });

  it("partial row contributes remaining balance to total", () => {
    const summary = feeDueBreakdown([
      { id: "p", month: 9, year: 2025, amount: 3000, discount: 0, paid_amount: 1000, status: "partial" },
      { id: "u", month: 10, year: 2025, amount: 2000, paid_amount: 0, status: "unpaid" },
    ]);
    expect(summary.totalDue).toBe(4000);
    expect(summary.lines[0]?.due).toBe(2000);
    expect(summary.lines[1]?.due).toBe(2000);
  });
});
