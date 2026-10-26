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
    { href: "/principal/salaries", label: "Pay salaries" },
    { href: "/principal/faculty", label: "Teachers" },
    { href: "/principal/finance", label: "Finance" },
    { href: "/principal/other-employees", label: "Other employees" },
    { href: "/principal/students", label: "Students" },
    { href: "/principal/assign", label: "Assign teacher" },
    { href: "/principal/announcements", label: "Announcements" },
    { href: "/principal/fees/overview", label: "Financial summary" },
  ],
  finance: [
    { href: "/finance", label: "Dashboard" },
    { href: "/finance/salaries", label: "Pay salaries" },
    { href: "/finance/teachers", label: "Teachers" },
    { href: "/finance/other-employees", label: "Other employees" },
    { href: "/finance/students", label: "Students" },
    { href: "/finance/assign", label: "Assign teacher" },
    { href: "/finance/collect", label: "Fee collection" },
    { href: "/finance/expenses", label: "Other expenses" },
    { href: "/finance/income-vs-expenses", label: "Financial summary" },
    { href: "/finance/announcements", label: "Announcements" },
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard" },
    { href: "/teacher/classes", label: "Assigned classes" },
    { href: "/teacher/students", label: "Students" },
    { href: "/teacher/salary", label: "Salary" },
    { href: "/teacher/announcements", label: "Announcements" },
  ],
};

const EXTRA = ["/profile"];
const ROOTS = new Set(["/principal", "/finance", "/teacher"]);
const SIBLING_SEGS = new Set(["new", "make", "pay", "status", "history", "import", "transfer", "school-transfer"]);

/** Module-level so desktop+mobile SideNav don't double-warm the same href. */
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

function leafActive(pathname: string, href: string) {
  const [baseHref] = href.split("?");
  if (ROOTS.has(baseHref)) return pathname === baseHref;
  if (baseHref === "/principal/finance" && (pathname === "/principal/finance" || pathname.startsWith("/principal/staff"))) {
    return true;
  }
  if (baseHref === "/principal/faculty" && (pathname === "/principal/faculty" || pathname.startsWith("/principal/teachers"))) {
    return true;
  }
  if (baseHref === "/principal/other-employees" && (pathname === "/principal/other-employees" || pathname.startsWith("/principal/employees"))) {
    return true;
  }
  if (baseHref === "/principal/students" && pathname.startsWith("/principal/students")) {
    return true;
  }
  if (baseHref === "/finance/students" && pathname.startsWith("/finance/students")) {
    return true;
  }
  if (baseHref === "/finance/teachers" && pathname.startsWith("/finance/teachers")) {
    return true;
  }
  if (baseHref === "/finance/other-employees" && (pathname.startsWith("/finance/other-employees") || pathname.startsWith("/finance/employees"))) {
    return true;
  }
  if (baseHref === "/finance/employees" && pathname.startsWith("/finance/employees")) {
    return true;
  }
  if (baseHref === "/finance/assign" && pathname.startsWith("/finance/assign")) {
    return true;
  }
  if (baseHref === "/finance/salaries" && pathname.startsWith("/finance/salaries")) {
    return true;
  }
  if (baseHref === "/finance/collect" && pathname.startsWith("/finance/collect")) {
    return true;
  }
  if (baseHref === "/finance/income-vs-expenses" && (pathname.startsWith("/finance/income-vs-expenses") || pathname.startsWith("/finance/account") || pathname.startsWith("/finance/history"))) {
    return true;
  }
  if (baseHref === "/principal/fees/overview" && (pathname.startsWith("/principal/fees/overview") || pathname.startsWith("/principal/account"))) {
    return true;
  }
  if (baseHref === "/teacher/classes" && pathname.startsWith("/teacher/classes")) {
    return true;
  }
  if (baseHref === "/teacher/students" && pathname.startsWith("/teacher/students")) {
    return true;
  }
  if (baseHref === "/teacher/salary" && pathname.startsWith("/teacher/salary")) {
    return true;
  }
  if (baseHref === "/teacher/announcements" && pathname.startsWith("/teacher/announcements")) {
    return true;
  }
  if (baseHref === "/finance/announcements" && pathname.startsWith("/finance/announcements")) {
    return true;
  }
  if (baseHref === "/principal/announcements" && pathname.startsWith("/principal/announcements")) {
    return true;
  }
  if (baseHref === "/principal/assign" && pathname.startsWith("/principal/assign")) {
    return true;
  }
  if (pathname === baseHref) return true;
  if (!pathname.startsWith(`${baseHref}/`)) return false;
  if (baseHref.endsWith("/new") || baseHref.endsWith("/make")) return false;
  const next = pathname.slice(baseHref.length + 1).split("/")[0];
  if (SIBLING_SEGS.has(next)) return false;
  return true;
}

function groupOpen(pathname: string, group: NavGroup) {
  if (pathname === "/principal/salaries") {
    return false;
  }
  return group.children.some((c) => {
    const [baseHref] = c.href.split("?");
    return baseHref !== "/principal/salaries" && (leafActive(pathname, baseHref) || pathname.startsWith(`${baseHref}/`));
  });
}

export function SideNav({
  role,
  variant,
  onNavigate,
}: {
  role: ShellRole;
  variant: "side" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = MENUS[role];
  const allHrefs = useMemo(() => [...flattenHrefs(items), ...EXTRA], [items]);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);

  useEffect(() => {
    const isFeed = pathname.includes("/announcements") && !pathname.includes("/make");
    if (isFeed) {
      setHasUnreadAnnouncements(false);
    }

    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ hasUnread: boolean }>;
      if (typeof custom.detail?.hasUnread === "boolean") {
        setHasUnreadAnnouncements(isFeed ? false : custom.detail.hasUnread);
      }
    };
    window.addEventListener("sms_announcement_unread_state", handler);
    return () => window.removeEventListener("sms_announcement_unread_state", handler);
  }, [pathname]);

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
      ? `block rounded-lg px-3 py-2 text-[15px] font-semibold leading-snug transition ${
          active
            ? "bg-gradient-to-r from-[#1a8cff] to-[#5dade2] text-white shadow-[0_0_14px_rgba(26,140,255,0.4)]"
            : "text-slate-200 hover:bg-white/10 hover:text-white"
        }`
      : `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
          active ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`;

  const childClass = (active: boolean) =>
    variant === "side"
      ? `block rounded-lg py-1.5 pl-5 pr-2 text-[14px] font-medium transition ${
          active
            ? "bg-gradient-to-r from-[#1a8cff]/90 to-[#5dade2]/80 text-white"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`
      : `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
          active ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`;

  const navLink = (href: string, label: string, className: string, showRedDot: boolean = false) => (
    <Link
      key={href}
      href={href}
      prefetch
      onMouseEnter={() => fullPrefetch(router, href)}
      onFocus={() => fullPrefetch(router, href)}
      onTouchStart={() => fullPrefetch(router, href)}
      onClick={() => {
        fullPrefetch(router, href);
        onNavigate?.();
      }}
      className={className}
    >
      <span className="inline-flex items-center justify-between w-full">
        <span className="truncate">{label}</span>
        {showRedDot && (
          <span className="relative flex h-2.5 w-2.5 shrink-0 ml-2" title="New Announcement">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </span>
        )}
      </span>
    </Link>
  );

  return (
    <>
      {items.map((item) => {
        if (!isGroup(item)) {
          const isAnnounce =
            (item.href.includes("announcements") || item.label.toLowerCase().includes("announcement")) &&
            !item.href.includes("/make") &&
            !item.label.toLowerCase().includes("make");
          return navLink(
            item.href,
            item.label,
            linkClass(leafActive(pathname, item.href)),
            isAnnounce && hasUnreadAnnouncements
          );
        }

        const expanded = open[item.id] ?? groupOpen(pathname, item);
        const isAnnounceGroup = item.id === "announcements" || item.label.toLowerCase().includes("announcement");

        if (variant === "mobile") {
          return (
            <div key={item.id} className="contents">
              {item.children.map((child) => {
                const isChildAnnounce =
                  isAnnounceGroup &&
                  child.href.includes("announcements") &&
                  !child.href.includes("/make") &&
                  !child.label.toLowerCase().includes("make");
                return navLink(
                  child.href,
                  child.label,
                  linkClass(leafActive(pathname, child.href)),
                  isChildAnnounce && hasUnreadAnnouncements
                );
              })}
            </div>
          );
        }

        return (
          <div key={item.id} className="space-y-0.5">
            <button
              type="button"
              onClick={() => setOpen((s) => ({ ...s, [item.id]: !expanded }))}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[15px] font-semibold transition ${
                expanded || groupOpen(pathname, item)
                  ? "bg-white/10 text-white"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span>{item.label}</span>
                {isAnnounceGroup && hasUnreadAnnouncements && (
                  <span className="relative flex h-2.5 w-2.5 shrink-0" title="New Announcement">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  </span>
                )}
              </span>
              <span className="text-[10px] opacity-70">{expanded ? "▾" : "▸"}</span>
            </button>
            {expanded &&
              item.children.map((child) => {
                const isChildAnnounce =
                  isAnnounceGroup &&
                  child.href.includes("announcements") &&
                  !child.href.includes("/make") &&
                  !child.label.toLowerCase().includes("make");
                return navLink(
                  child.href,
                  child.label,
                  childClass(leafActive(pathname, child.href)),
                  isChildAnnounce && hasUnreadAnnouncements
                );
              })}
          </div>
        );
      })}
    </>
  );
}
