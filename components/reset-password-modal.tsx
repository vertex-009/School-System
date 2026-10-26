"use client";

import { useState } from "react";
import { adminResetTeacherPassword } from "@/lib/actions";
import { CredentialSuccessModal } from "@/components/credential-success-modal";

interface ResetTeacherPasswordButtonProps {
  teacherId: string;
  name: string;
  email: string;
  roleTitle?: string;
  directoryHref?: string;
}

export function ResetTeacherPasswordButton({
  teacherId,
  name,
  email,
  roleTitle = "Teacher",
  directoryHref = "/principal/teachers",
}: ResetTeacherPasswordButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    ok: boolean;
    password: string;
  } | null>(null);

  const generateRandomPassword = () => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    let gen = "";
    for (let i = 0; i < 3; i++) gen += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 3; i++) gen += lowercase[Math.floor(Math.random() * lowercase.length)];
    gen += "@";
    for (let i = 0; i < 3; i++) gen += digits[Math.floor(Math.random() * digits.length)];
    setPassword(gen);
    setError(null);
  };

  const handleOpen = () => {
    generateRandomPassword();
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.trim().length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    setPending(true);
    setError(null);

    try {
      const res = await adminResetTeacherPassword(teacherId, password.trim());
      if (res?.ok) {
        setIsOpen(false);
        setSuccessResult({ ok: true, password: password.trim() });
      } else {
        setError(res?.error || "Failed to reset password");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-brand-navy transition cursor-pointer"
        title="Reset login password"
      >
        <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        Reset Password
      </button>

      {/* Reset Password Input Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-navy to-brand-accent p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                    <svg className="h-5 w-5 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reset Password</h3>
                    <p className="text-xs text-sky-200/80">{name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white transition"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Login Email
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700">
                  {email || "No email assigned"}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-brand-accent hover:underline cursor-pointer"
                  >
                    🎲 Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    required
                    minLength={8}
                    placeholder="Enter new password (min 8 chars)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Password must be at least 8 characters. You can copy the credentials on the next screen.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-brand-navy px-5 py-2 text-xs font-bold text-white hover:bg-brand-accent transition shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {pending ? "Saving..." : "Set New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal with Copy Credentials */}
      {successResult?.ok && (
        <CredentialSuccessModal
          roleTitle={roleTitle}
          name={name}
          email={email}
          password={successResult.password}
          directoryHref={directoryHref}
          directoryLabel="Back to Teachers"
          onClose={() => setSuccessResult(null)}
        />
      )}
    </>
  );
}

