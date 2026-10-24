"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SuggestionItem = {
  id: string;
  name: string;
  father_name: string;
  roll_no: number | null;
  admission_no: string;
  className: string;
};

export function StudentSearchBar({
  defaultValue = "",
  month,
  year,
}: {
  defaultValue?: string;
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setIsOpen((data.results || []).length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(student: SuggestionItem) {
    setQuery(student.name);
    setIsOpen(false);
    // Navigate with exact student_id and q
    const params = new URLSearchParams();
    params.set("month", String(month));
    params.set("year", String(year));
    params.set("q", student.name);
    params.set("student_id", student.id);
    router.push(`/finance/collect?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || !suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const chosen = suggestions[selectedIndex];
      if (chosen) handleSelect(chosen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search by name, roll no, or admission no..."
          autoComplete="off"
          required
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/30 shadow-xs"
        />
        {loading ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </span>
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl transition">
          <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between">
            <span>Matching Students</span>
            <span>{suggestions.length} found</span>
          </div>

          <ul className="divide-y divide-slate-50">
            {suggestions.map((s, idx) => {
              const isHighlighted = idx === selectedIndex;
              return (
                <li
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition ${
                    isHighlighted ? "bg-sky-50 text-brand-navy" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-brand-navy truncate">{s.name}</span>
                      {s.className && (
                        <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-extrabold text-brand-navy">
                          {s.className}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Father: <span className="font-medium text-slate-700">{s.father_name || "—"}</span>
                      {s.roll_no != null && (
                        <> · Roll: <span className="font-semibold text-slate-700">{s.roll_no}</span></>
                      )}
                      {s.admission_no && (
                        <> · Adm: <span className="font-mono text-slate-600">{s.admission_no}</span></>
                      )}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-bold text-brand-accent">Select →</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

