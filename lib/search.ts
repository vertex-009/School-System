/**
 * Name search: match whole words by prefix, not mid-word substrings.
 * "ali" → Ali, Ali Khan, Muhammad Ali — NOT Malik / Khalid.
 */

/** Escape LIKE wildcards in user input. */
export function escapeLike(term: string): string {
  return String(term || "").replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

function quoteFilterValue(value: string): string {
  // PostgREST needs quotes when value has spaces / special chars
  return `"${value.replace(/"/g, "")}"`;
}

/** PostgREST filter fragments for one text column (word-prefix). */
export function wordPrefixFilters(column: string, term: string): string[] {
  const t = escapeLike(term.trim());
  if (!t) return [];
  return [
    `${column}.ilike.${quoteFilterValue(`${t}%`)}`,
    `${column}.ilike.${quoteFilterValue(`% ${t}%`)}`,
    `${column}.ilike.${quoteFilterValue(`%-${t}%`)}`,
  ];
}

/**
 * Student search OR clause: name / father_name word-prefix + admission prefix.
 * Use with `.or(studentSearchOr(q))`.
 */
export function studentSearchOr(term: string): string {
  const t = term.trim();
  if (!t) return "";
  const parts = [
    ...wordPrefixFilters("name", t),
    ...wordPrefixFilters("father_name", t),
    `admission_no.ilike.${quoteFilterValue(`${escapeLike(t)}%`)}`,
  ];
  return parts.join(",");
}

/** Client-side word-prefix match (pickers, in-memory lists). */
export function matchesWordPrefix(text: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return String(text || "")
    .toLowerCase()
    .split(/[\s\-_/.,]+/)
    .filter(Boolean)
    .some((word) => word.startsWith(needle));
}

/** Keep student rows whose name / father / admission match word-prefix search. */
export function filterStudentsBySearch<
  T extends { name?: string | null; father_name?: string | null; admission_no?: string | null },
>(rows: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    if (matchesWordPrefix(row.name || "", q)) return true;
    if (matchesWordPrefix(row.father_name || "", q)) return true;
    const adm = String(row.admission_no || "").toLowerCase();
    return adm.startsWith(q);
  });
}
