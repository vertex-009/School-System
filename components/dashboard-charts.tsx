"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export type DashStat = {
  label: string;
  value: number | string;
  href?: string;
  tone?: "navy" | "sky" | "emerald" | "amber" | "rose";
  hint?: string;
  icon?: "invoice-paid" | "invoice-unpaid" | "wallet" | "coins";
};

/** Dot / icon / decorative arc colors — matches design quick-link cards */
const TONE_DOT = {
  navy: "bg-[#0b1f3a]",
  sky: "bg-emerald-500",
  emerald: "bg-[#0b1f3a]",
  amber: "bg-rose-500",
  rose: "bg-orange-400",
};

const TONE_ICON_WRAP = {
  navy: "bg-[#e8eef5] text-[#0b1f3a]",
  sky: "bg-[#dcebff] text-[#3b82f6]",
  emerald: "bg-[#d1fae5] text-[#059669]",
  amber: "bg-[#ede9fe] text-[#7c3aed]",
  rose: "bg-[#ffe4e6] text-[#e11d48]",
};

const TONE_ARC = {
  navy: "#c5d0dc",
  sky: "#bfdbfe",
  emerald: "#a7f3d0",
  amber: "#ddd6fe",
  rose: "#fecdd3",
};

function StatIcon({ kind }: { kind?: DashStat["icon"] }) {
  const common = "h-5 w-5";
  switch (kind) {
    case "invoice-unpaid":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M8 3h6l4 4v14H8V3z" />
          <path d="M14 3v4h4M10 13h6M10 17h4" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M16 14.5h2" />
        </svg>
      );
    case "coins":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <ellipse cx="12" cy="7" rx="7" ry="3" />
          <path d="M5 7v4c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 11v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
        </svg>
      );
    case "invoice-paid":
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M8 3h6l4 4v14H8V3z" />
          <path d="M14 3v4h4M9.5 14.5l2 2 4-4" />
        </svg>
      );
  }
}

/** KPI / quick-link tiles — white cards, icon + text row, corner dot + soft arc */
export function StatTiles({ items }: { items: DashStat[] }) {
  return (
    <div className="grid w-full max-w-full shrink-0 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const tone = item.tone || "navy";
        const inner = (
          <div className="relative flex h-full min-h-[7.5rem] sm:min-h-[8.25rem] items-center overflow-hidden rounded-2xl border border-slate-100/90 bg-white px-3.5 py-4 sm:px-4 sm:py-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
            {/* Soft decorative arc — bottom right */}
            <svg
              aria-hidden
              className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 opacity-70"
              viewBox="0 0 80 80"
            >
              <circle cx="56" cy="56" r="36" fill={TONE_ARC[tone]} fillOpacity="0.55" />
              <circle cx="56" cy="56" r="22" fill={TONE_ARC[tone]} fillOpacity="0.35" />
            </svg>

            <span className={`absolute right-3.5 top-3.5 h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />

            <div className="relative z-[1] flex w-full min-w-0 items-center gap-3 sm:gap-3.5 pr-2 sm:pr-3">
              <div
                className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full ${TONE_ICON_WRAP[tone]}`}
                aria-hidden
              >
                <StatIcon kind={item.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500 sm:text-[11px]">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-[#0b1f3a] sm:text-xl lg:text-2xl">
                  {item.value}
                </p>
                {item.hint && <p className="mt-0.5 truncate text-[11px] text-slate-400">{item.hint}</p>}
              </div>
            </div>
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="block h-full">
            {inner}
          </Link>
        ) : (
          <div key={item.label} className="h-full">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export type BarItem = {
  label: string;
  value: number;
  color?: string;
  showBar?: boolean;
  /** Scale this bar against items sharing the same group (e.g. counts vs amounts). */
  scaleGroup?: string;
  /** Fixed denominator for bar width (e.g. paid+unpaid total). Overrides group max when set. */
  scaleMax?: number;
  href?: string;
  quickLinks?: { label: string; href: string; icon?: string; hint?: string }[];
};

function IconBars({ className = "h-4 w-4 text-[#3b9fd9]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="12" width="3.5" height="8" rx="1" />
      <rect x="10.25" y="7" width="3.5" height="13" rx="1" />
      <rect x="16.5" y="3" width="3.5" height="17" rx="1" />
    </svg>
  );
}

function IconPeople({ className = "h-4 w-4 text-[#3b9fd9]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="16.5" cy="9" r="2.6" opacity="0.85" />
      <path d="M2.5 19c0-3.2 2.9-5.2 6.5-5.2S15.5 15.8 15.5 19v.5H2.5V19z" />
      <path d="M15 19c0-2.2 1.5-3.6 3.8-3.9 1.9.3 3.2 1.5 3.2 3.4v.5H15V19z" opacity="0.85" />
    </svg>
  );
}

export function ColumnChartCard({
  title,
  subtitle,
  items,
  className = "",
}: {
  title: string;
  subtitle?: string;
  items: BarItem[];
  className?: string;
}) {
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rawMax = Math.max(1, ...items.map((i) => i.value));
  const axisMax = Math.max(5, Math.ceil(rawMax / 5) * 5);
  const ticks = [0, axisMax * 0.2, axisMax * 0.4, axisMax * 0.6, axisMax * 0.8, axisMax].map((n) =>
    Math.round(n)
  );

  const activeItem = items.find((i) => i.label === activePopover);

  return (
    <section
      ref={containerRef}
      className={`relative flex h-full min-h-0 flex-col overflow-visible rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${className}`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconPeople />
          <h2 className="text-sm font-bold text-[#0b1f3a]">{title}</h2>
        </div>
        {subtitle && <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>}
      </div>

      {/* High-polish Quick Links Flyout Overlay */}
      {activeItem && activeItem.quickLinks && (
        <div
          className="absolute inset-x-2 top-2 z-30 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md ring-1 ring-black/5 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b1f3a] text-xs font-bold text-white shadow-2xs">
                ⚡
              </span>
              <span className="text-xs font-black text-slate-800">
                {activeItem.label} Actions
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePopover(null)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeItem.quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setActivePopover(null)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs font-bold text-slate-800 hover:bg-sky-50 hover:border-sky-200 hover:text-brand-navy transition group shadow-2xs"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-xs group-hover:scale-110 transition-transform">
                  {link.icon || "→"}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-900 group-hover:text-brand-navy">
                    {link.label}
                  </span>
                  {link.hint && (
                    <span className="block truncate text-[10px] font-normal text-slate-400 group-hover:text-slate-500">
                      {link.hint}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-2.5">
        {/* Y-axis */}
        <div className="flex w-7 shrink-0 flex-col justify-between pb-6 pt-0.5 text-right">
          {[...ticks].reverse().map((t) => (
            <span key={t} className="text-[9px] tabular-nums leading-none text-slate-400">
              {t}
            </span>
          ))}
        </div>

        <div className="relative min-h-0 flex-1">
          {/* Grid lines */}
          <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between pointer-events-none">
            {ticks.map((t) => (
              <div key={t} className="border-t border-slate-100/90" />
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-6 top-0 flex items-end justify-around gap-2 px-1 sm:gap-3 sm:px-2">
            {items.map((item) => {
              const h = Math.max(item.value > 0 ? 8 : 3, Math.round((item.value / axisMax) * 100));
              const hasQuickLinks = Boolean(item.quickLinks && item.quickLinks.length > 0);
              const isOpen = activePopover === item.label;

              const content = (
                <div
                  className={`relative flex h-full w-full max-w-[4.25rem] flex-col items-center justify-end gap-1.5 ${
                    hasQuickLinks || item.href ? "cursor-pointer group" : ""
                  }`}
                  onClick={() => {
                    if (hasQuickLinks) {
                      setActivePopover(isOpen ? null : item.label);
                    }
                  }}
                  title={hasQuickLinks ? `Click for ${item.label} quick links` : `${item.label}: ${item.value}`}
                >
                  <span className="text-[11px] font-bold tabular-nums text-slate-600 group-hover:text-[#0b1f3a] transition-colors">
                    {item.value}
                  </span>
                  <div
                    className={`w-full min-w-[2.25rem] rounded-t-md transition-all sm:min-w-[2.75rem] group-hover:opacity-90 group-hover:shadow-sm ${
                      isOpen ? "ring-2 ring-sky-400 ring-offset-1" : ""
                    }`}
                    style={{
                      height: `${h}%`,
                      background: item.color || "#0b1f3a",
                    }}
                  />
                </div>
              );

              return item.href && !hasQuickLinks ? (
                <Link key={item.label} href={item.href} className="flex h-full w-full max-w-[4.25rem] flex-col items-center justify-end">
                  {content}
                </Link>
              ) : (
                <div key={item.label} className="contents">
                  {content}
                </div>
              );
            })}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-around gap-2 px-1 sm:gap-3 sm:px-2">
            {items.map((item) => {
              const hasQuickLinks = Boolean(item.quickLinks && item.quickLinks.length > 0);
              return hasQuickLinks ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActivePopover(activePopover === item.label ? null : item.label)}
                  className={`w-full max-w-[4.25rem] truncate text-center text-[10px] font-bold rounded-lg px-1 py-0.5 transition cursor-pointer ${
                    activePopover === item.label
                      ? "bg-[#0b1f3a] text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-brand-navy"
                  }`}
                  title={`Click for ${item.label} quick links`}
                >
                  {item.label} ▾
                </button>
              ) : item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="w-full max-w-[4.25rem] truncate text-center text-[10px] font-medium text-slate-500 hover:text-brand-navy"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  className="w-full max-w-[4.25rem] truncate text-center text-[10px] font-medium text-slate-500"
                >
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BarChartCard({
  title,
  subtitle,
  items,
  className = "",
}: {
  title: string;
  subtitle?: string;
  items: BarItem[];
  className?: string;
}) {
  const globalMax = Math.max(1, ...items.map((i) => i.value));
  const groupMax = new Map<string, number>();
  for (const item of items) {
    if (!item.scaleGroup) continue;
    groupMax.set(item.scaleGroup, Math.max(groupMax.get(item.scaleGroup) || 1, item.value));
  }

  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${className}`}
    >
      <div className="mb-0.5 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconBars />
          <h2 className="text-sm font-bold text-[#0b1f3a]">{title}</h2>
        </div>
        {subtitle && <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>}
      </div>

      <ul className="flex min-h-0 flex-1 flex-col justify-evenly">
        {items.map((item, idx) => {
          const showBar = item.showBar !== false;
          const scale =
            item.scaleMax && item.scaleMax > 0
              ? item.scaleMax
              : item.scaleGroup
                ? groupMax.get(item.scaleGroup) || globalMax
                : globalMax;
          const widthPct =
            item.value <= 0 ? 0 : Math.max(4, Math.min(100, Math.round((item.value / scale) * 100)));
          return (
            <li
              key={item.label}
              className={`flex flex-col justify-center py-1 ${idx > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-slate-500">{item.label}</span>
                <span className="shrink-0 text-[15px] font-bold tabular-nums text-[#0b1f3a]">
                  {item.value.toLocaleString()}
                </span>
              </div>
              {showBar && (
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${widthPct}%`,
                      background: item.color || "#94a3b8",
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RingCard({
  title,
  percent,
  center,
  footnote,
  period,
  color = "#5dade2",
  dark = false,
}: {
  title?: string;
  percent: number;
  center: string;
  footnote?: string;
  period?: string;
  color?: string;
  dark?: boolean;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  const track = dark ? "#1a3558" : "#eef2f7";
  const centerCls = dark ? "text-white" : "text-brand-navy";
  const noteCls = dark ? "text-white/70" : "text-slate-400";
  const periodCls = dark ? "text-sky-200/70" : "text-slate-400";

  return (
    <section className={dark ? "bg-transparent p-0" : "rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"}>
      {title ? <h2 className={`text-sm font-bold ${dark ? "text-white" : "text-brand-navy"}`}>{title}</h2> : null}
      <div className={`${title ? "mt-2" : ""} flex flex-col items-center`}>
        <div className="relative h-[8.5rem] w-[8.5rem] sm:h-[9.25rem] sm:w-[9.25rem] lg:h-[10rem] lg:w-[10rem]">
          <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7ec8f0" />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            </defs>
            <circle cx="65" cy="65" r={r} fill="none" stroke={track} strokeWidth="11" />
            <circle
              cx="65"
              cy="65"
              r={r}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
            <p className={`text-xl font-bold leading-none tracking-tight sm:text-2xl ${centerCls}`}>{center}</p>
            {footnote && (
              <p className={`mt-1.5 text-[11px] font-medium leading-tight ${noteCls}`}>{footnote}</p>
            )}
            {period && <p className={`mt-0.5 text-[10px] ${periodCls}`}>{period}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashIntro({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-1 rounded-xl border border-slate-200/80 bg-gradient-to-r from-brand-navy to-brand-accent px-5 py-4 text-white">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-white/75">{detail}</p>
    </div>
  );
}
