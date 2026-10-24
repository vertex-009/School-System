"use client";

import { useState } from "react";
import Link from "next/link";

interface CredentialSuccessModalProps {
  roleTitle: string; // e.g. "Teacher" or "Finance Staff"
  name: string;
  email: string;
  password?: string;
  directoryHref: string;
  directoryLabel: string;
  onClose: () => void;
}

export function CredentialSuccessModal({
  roleTitle,
  name,
  email,
  password = "",
  directoryHref,
  directoryLabel,
  onClose,
}: CredentialSuccessModalProps) {
  const [copiedType, setCopiedType] = useState<"all" | "email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(true);

  const copyText = (text: string, type: "all" | "email" | "password") => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType((cur) => (cur === type ? null : cur));
    }, 2000);
  };

  const copyAll = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = [
      `--- ${roleTitle.toUpperCase()} LOGIN CREDENTIALS ---`,
      `Full Name: ${name}`,
      `Role: ${roleTitle}`,
      `Email: ${email}`,
      `Password: ${password}`,
      origin ? `Login URL: ${origin}/login` : "",
      `--------------------------------------`,
    ]
      .filter(Boolean)
      .join("\n");
    copyText(text, "all");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Top header banner */}
        <div className="relative bg-gradient-to-br from-[#0b1f3a] via-[#0d2744] to-[#1a5276] p-6 text-white text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-0.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
            {roleTitle} Account Ready
          </span>

          <h3 className="mt-2 text-xl font-bold text-white tracking-tight">
            Account Created Successfully!
          </h3>
          <p className="mt-1 text-xs text-sky-100/80">
            Login credentials generated for <strong className="text-white font-semibold">{name}</strong>
          </p>
        </div>

        {/* Credentials Body */}
        <div className="p-6 space-y-4">
          {/* Email Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              <span>Email / Username</span>
              <button
                type="button"
                onClick={() => copyText(email, "email")}
                className="inline-flex items-center gap-1 font-semibold text-brand-navy hover:text-brand-accent transition cursor-pointer"
              >
                {copiedType === "email" ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-900 break-all select-all font-mono">
              {email}
            </p>
          </div>

          {/* Password Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              <span>Password</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => copyText(password, "password")}
                  className="inline-flex items-center gap-1 font-semibold text-brand-navy hover:text-brand-accent transition cursor-pointer"
                >
                  {copiedType === "password" ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-900 font-mono tracking-wider select-all">
              {showPassword ? password : "••••••••••••"}
            </p>
          </div>

          {/* Notice Banner */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-900">
            <span className="text-amber-600 text-sm mt-0.5 shrink-0">⚠️</span>
            <p className="leading-snug">
              <strong>Save these credentials now.</strong> For security purposes, passwords are shown only once and cannot be recovered later.
            </p>
          </div>

          {/* One-click Copy All Button */}
          <button
            type="button"
            onClick={copyAll}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-sm font-bold shadow-xs transition cursor-pointer ${
              copiedType === "all"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {copiedType === "all" ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                All Credentials Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy All Credentials
              </>
            )}
          </button>

          {/* Action links */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              + Add Another
            </button>
            <Link
              href={directoryHref}
              className="font-bold text-brand-navy hover:text-brand-accent transition hover:underline flex items-center gap-1"
            >
              {directoryLabel} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

