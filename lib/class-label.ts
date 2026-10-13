/** Display helpers — school uses one unit per class (no Section A/B in UI). */

export function classNameOf(section: unknown): string {
  const row = section as { name?: string; classes?: { name?: string } | { name?: string }[] } | null;
  if (!row) return "No class";
  const klass = Array.isArray(row.classes) ? row.classes[0]?.name : row.classes?.name;
  return klass || "Class";
}

/** One primary section per class (first by name). */
export function primarySectionIdByClass(
  sections: { id: string; class_id: string; name?: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  const sorted = [...sections].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  for (const s of sorted) {
    if (!map.has(s.class_id)) map.set(s.class_id, s.id);
  }
  return map;
}

export const DEFAULT_SECTION_NAME = "-";
