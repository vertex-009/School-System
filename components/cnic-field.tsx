"use client";

import { useState, useEffect } from "react";
import { formatCnicInput, normalizeCnic, isValidCnic } from "@/lib/cnic";

interface CnicFieldProps {
  label?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (formatted: string, rawDigits: string) => void;
  required?: boolean;
  error?: string | null;
  helper?: string;
  disabled?: boolean;
  className?: string;
}

export function CnicField({
  label = "CNIC",
  name = "cnic",
  value: controlledValue,
  defaultValue = "",
  onChange,
  required = true,
  error,
  helper,
  disabled = false,
  className = "",
}: CnicFieldProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    formatCnicInput(controlledValue ?? defaultValue)
  );
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isControlled) {
      setInternalValue(formatCnicInput(controlledValue ?? ""));
    }
  }, [controlledValue, isControlled]);

  const displayValue = isControlled ? formatCnicInput(controlledValue ?? "") : internalValue;
  const rawDigits = normalizeCnic(displayValue);
  const digitCount = rawDigits.length;
  const isValid = isValidCnic(displayValue);

  // Determine error state
  const isBlurIncomplete = touched && digitCount > 0 && digitCount < 13;
  const displayError =
    error || (isBlurIncomplete ? `Incomplete CNIC: 13 digits required (entered ${digitCount})` : null);
  const hasError = Boolean(displayError);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnicInput(e.target.value);
    const digits = normalizeCnic(formatted);
    if (!isControlled) {
      setInternalValue(formatted);
    }
    onChange?.(formatted, digits);
  };

  return (
    <div className={`block text-xs font-bold text-slate-600 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={name} className="flex items-center gap-1 cursor-pointer">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold text-sm leading-none select-none" title="Required">•</span>}
        </label>
      </div>

      <div className="relative mt-1.5">
        <input
          id={name}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="12345-1234567-1"
          maxLength={15}
          value={displayValue}
          disabled={disabled}
          required={required}
          onChange={handleInputChange}
          onBlur={() => setTouched(true)}
          className={`w-full rounded-xl border px-3 py-2.5 text-sm tracking-wide transition outline-none ${
            hasError
              ? "border-rose-400 bg-rose-50/30 text-rose-950 placeholder:text-rose-300 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/30"
              : isValid
              ? "border-emerald-300 bg-emerald-50/20 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
              : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        />
        {/* CNIC format badge on right */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[10px] font-mono font-medium text-slate-400">
          XXXXX-XXXXXXX-X
        </span>
      </div>

      {hasError && (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600 animate-fadeIn">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {displayError}
        </p>
      )}

      {!hasError && helper && <p className="mt-1 text-[11px] text-slate-400">{helper}</p>}
    </div>
  );
}

