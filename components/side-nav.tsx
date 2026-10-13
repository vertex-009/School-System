"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import type { ShellRole } from "@/components/shell";

type NavLeaf = { href: string; label: string };
type NavGroup = { id: string; label: string; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

const MENUS: Record<ShellRole, NavItem[]> = {
  principal: [
    { href: "/principal", label: "Dashboard" },
    {
      id: "finance",
      label: "Finance",
      children: [
        { href: "/principal/staff/new", label: "Add finance" },
        { href: "/principal/staff", label: "Finance staff" },
      ],
    },
    {
      id: "faculty",
      label: "Faculty",
      children: [
        { href: "/principal/teachers/new", label: "Add teacher" },
        { href: "/principal/teachers", label: "View teachers" },
      ],
    },
    {
      id: "other-employees",
      label: "Other employees",
      children: [
        { href: "/principal/employees/new", label: "Add employee" },
        { href: "/principal/employees", label: "View" },
      ],
    },
    {
      id: "assign",
      label: "Assign teachers",
      children: [
        { href: "/principal/assign", label: "Assign teacher" },
        { href: "/principal/assign/history", label: "History / view" },
      ],
    },
    { href: "/principal/timetable", label: "Timetable" },
    { href: "/principal/students", label: "Total students" },
    { href: "/principal/results", label: "Exam / results" },
    {
      id: "announcements",
      label: "Announcements",
      children: [
        { href: "/principal/announcements/make", label: "Make announcement" },
        { href: "/principal/announcements", label: "History" },
      ],
    },
    { href: "/principal/account", label: "Monthly account" },
    { href: "/principal/fees/overview", label: "Financial summary" },
    { href: "/principal/reports", label: "Reports" },
  ],
  finance: [
    { href: "/finance", label: "Dashboard" },
    { href: "/finance/students", label: "Students" },
    { href: "/finance/students/new", label: "Add student" },
    { href: "/finance/students/import", label: "Import by class" },
    { href: "/finance/students/transfer", label: "Class transfer" },
    { href: "/finance/students/school-transfer", label: "School transfer" },
    { href: "/finance/fees", label: "Set class fees" },
    { href: "/finance/collect", label: "Collect cash" },
    { href: "/finance/history", label: "Collection history" },
    { href: "/finance/fee-records", label: "Student fee records" },
    { href: "/finance/fees/receipts", label: "Fee receipts" },
    { href: "/finance/fees/monthly", label: "Monthly fee collection" },
    {
      id: "other-employees",
      label: "Other employees",
      children: [
        { href: "/finance/employees", label: "Set salary" },
        { href: "/finance/employees/pay", label: "Pay salary" },
        { href: "/finance/employees/history", label: "History" },
      ],
    },
    {
      id: "staff",
      label: "Staff",
      children: [
        { href: "/finance/salaries", label: "Set salary" },
        { href: "/finance/salaries/pay", label: "Pay salary" },
        { href: "/finance/salaries/status", label: "History" },
      ],
    },
    { href: "/finance/expenses", label: "School expenses" },
    { href: "/finance/expenses/other", label: "Other payments / expenses" },
    { href: "/finance/income-vs-expenses", label: "Income vs expenses" },
    {
      id: "announcements",
      label: "Announcements",
      children: [
        { href: "/finance/announcements/make", label: "Make announcement" },
        { href: "/finance/announcements", label: "History" },
      ],
    },
    { href: "/finance/reports", label: "Financial reports" },
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard" },
    {
      id: "timetable",
      label: "Timetable",
      children: [
        { href: "/teacher/timetable", label: "My timetable" },
        { href: "/teacher/classes", label: "Assigned classes" },
      ],
    },
    { href: "/teacher/students", label: "Students" },
    { href: "/teacher/attendance", label: "Mark attendance" },
    { href: "/teacher/marks", label: "Enter marks" },
    {
      id: "salary",
      label: "My salary",
      children: [
        { href: "/teacher/salary", label: "Current month" },
        { href: "/teacher/salary/history", label: "History" },
      ],
    },
    {
      id: "announcements",
      label: "Announcements",
      children: [
        { href: "/teacher/announcements/make", label: "Make announcement" },
        { href: "/teacher/announcements", label: "History" },
      ],
    },
    { href: "/teacher/reports", label: "Reports" },
  ],
};

const EXTRA = ["/profile"];
const ROOTS = new Set(["/principal", "/finance", "/teacher"]);

/** Module-level so desktop+mobile SideNav don’t double-warm the same href. */
const warmedHrefs = new Set<string>();

function fullPrefetch(router: ReturnType<typeof useRouter>, href: string) {
  if (warmedHrefs.has(href)) return;
  warmedHrefs.add(href);
  // FULL = warm RSC payload so sidebar click does not wait / flash a loading UI.
  router.prefetch(href, { kind: PrefetchKind.FULL });
}

function flattenHrefs(items: NavItem[]): string[] {
  return items.flatMap((item) => (isGroup(item) ? item.children.map((c) => c.href) : [item.href]));
}

/** Sibling route segments that must not activate a parent leaf (e.g. /salaries vs /salaries/pay). */
const SIBLING_SEGS = new Set(["new", "make", "pay", "status", "history", "import", "transfer", "school-transfer"]);

function leafActive(pathname: string, href: string) {
  if (ROOTS.has(href)) return pathname === href;
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  if (href.endsWith("/new") || href.endsWith("/make")) return false;
  const next = pathname.slice(href.length + 1).split("/")[0];
  if (SIBLING_SEGS.has(next)) return false;
  return true;
}

function groupOpen(pathname: string, group: NavGroup) {
  return group.children.some((c) => leafActive(pathname, c.href) || pathname.startsWith(`${c.href}/`));
}

export function SideNav({ role, variant }: { role: ShellRole; variant: "side" | "mobile" }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = MENUS[role];
  const allHrefs = useMemo(() => [...flattenHrefs(items), ...EXTRA], [items]);

  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of items) {
      if (isGroup(item)) next[item.id] = groupOpen(pathname, item);
    }
    setOpen((prev) => ({ ...prev, ...next }));
  }, [pathname, items]);

  useEffect(() => {
    // Only desktop instance warms the whole menu (mobile still hover/touch-prefetches).
    if (variant !== "side") return;

    const hrefs = allHrefs.filter((h) => h !== pathname);

    // Immediate FULL warm of every sidebar route — no idle queue gaps.
    const start = window.setTimeout(() => {
      for (const href of hrefs) fullPrefetch(router, href);
    }, 30);

    return () => clearTimeout(start);
  }, [variant, role, pathname, router, allHrefs]);

  const linkClass = (active: boolean) =>
    variant === "side"
      ? `block rounded-lg px-3 py-2 transition ${active ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`
      : `shrink-0 rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-700"}`;

  const childClass = (active: boolean) =>
    variant === "side"
      ? `block rounded-lg py-1.5 pl-6 pr-3 text-sm transition ${active ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"}`
      : `shrink-0 rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-700"}`;

  const navLink = (href: string, label: string, className: string) => (
    <Link
      key={href}
      href={href}
      prefetch
      onMouseEnter={() => fullPrefetch(router, href)}
      onFocus={() => fullPrefetch(router, href)}
      onTouchStart={() => fullPrefetch(router, href)}
      onClick={() => fullPrefetch(router, href)}
      className={className}
    >
      {label}
    </Link>
  );

  return (
    <>
      {items.map((item) => {
        if (!isGroup(item)) {
          return navLink(item.href, item.label, linkClass(leafActive(pathname, item.href)));
        }

        const expanded = open[item.id] ?? groupOpen(pathname, item);
        if (variant === "mobile") {
          return (
            <div key={item.id} className="contents">
              {item.children.map((child) =>
                navLink(child.href, child.label, linkClass(leafActive(pathname, child.href)))
              )}
            </div>
          );
        }

        return (
          <div key={item.id} className="space-y-0.5">
            <button
              type="button"
              onClick={() => setOpen((s) => ({ ...s, [item.id]: !expanded }))}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                expanded || groupOpen(pathname, item)
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] opacity-70">{expanded ? "▾" : "▸"}</span>
            </button>
            {expanded &&
              item.children.map((child) =>
                navLink(child.href, child.label, childClass(leafActive(pathname, child.href)))
              )}
          </div>
        );
      })}
    </>
  );
}
