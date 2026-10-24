import { describe, expect, it } from "vitest";
import { inEmploymentWindow, inEnrollmentWindow, toMonthKey } from "./period";

describe("toMonthKey", () => {
  it("extracts year and month accurately regardless of date strings or timestamps", () => {
    expect(toMonthKey("2026-10-15")).toBe(2026 * 12 + 10);
    expect(toMonthKey("2026-10-01T00:00:00.000Z")).toBe(2026 * 12 + 10);
    expect(toMonthKey("2026-09-30")).toBe(2026 * 12 + 9);
    expect(toMonthKey(null)).toBeNull();
    expect(toMonthKey("")).toBeNull();
  });
});

describe("inEmploymentWindow", () => {
  it("returns false for months prior to teacher joining date", () => {
    const joinedOn = "2026-10-01";
    // September 2026 is before October 2026
    expect(inEmploymentWindow(joinedOn, null, { month: 9, year: 2026, isFuture: false })).toBe(false);
  });

  it("returns true for months on or after teacher joining date", () => {
    const joinedOn = "2026-10-01";
    // October 2026
    expect(inEmploymentWindow(joinedOn, null, { month: 10, year: 2026, isFuture: false })).toBe(true);
  });

  it("returns false if teacher already left before the period", () => {
    const joinedOn = "2026-01-01";
    const leftOn = "2026-05-15";
    // June 2026 is after left date
    expect(inEmploymentWindow(joinedOn, leftOn, { month: 6, year: 2026, isFuture: false })).toBe(false);
    // May 2026 is allowed
    expect(inEmploymentWindow(joinedOn, leftOn, { month: 5, year: 2026, isFuture: false })).toBe(true);
  });
});

describe("inEnrollmentWindow", () => {
  it("returns false for student fee months prior to admission date", () => {
    const studentJoined = "2026-10-01";
    // September is before admission
    expect(inEnrollmentWindow(studentJoined, { month: 9, year: 2026 })).toBe(false);
    // August is before admission
    expect(inEnrollmentWindow(studentJoined, { month: 8, year: 2026 })).toBe(false);
  });

  it("returns true for student fee months on or after admission date", () => {
    const studentJoined = "2026-10-01";
    expect(inEnrollmentWindow(studentJoined, { month: 10, year: 2026 })).toBe(true);
    expect(inEnrollmentWindow(studentJoined, { month: 11, year: 2026 })).toBe(true);
  });
});

