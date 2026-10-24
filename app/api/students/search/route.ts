import { NextResponse } from "next/server";
import { getContext } from "@/lib/session";
import { classNameOf } from "@/lib/class-label";

export async function GET(request: Request) {
  try {
    const { supabase, schoolId, profile } = await getContext();
    if (!schoolId || !["finance", "principal"].includes(profile.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    if (!q || q.length < 1) {
      return NextResponse.json({ results: [] });
    }

    // Clean query
    const clean = q.replace(/[%_\\]/g, "");

    // Search query on students table
    let query = supabase
      .from("students")
      .select("id, name, father_name, admission_no, roll_no, status, sections(name, classes(name))")
      .eq("school_id", schoolId)
      .eq("status", "active");

    if (/^\d+$/.test(clean)) {
      // Numerical: roll number or admission number
      query = query.or(`roll_no.eq.${clean},admission_no.ilike.%${clean}%,name.ilike.%${clean}%`);
    } else {
      // Text: name, father_name, or admission_no
      query = query.or(`name.ilike.%${clean}%,father_name.ilike.%${clean}%,admission_no.ilike.%${clean}%`);
    }

    const { data: students, error } = await query
      .order("name", { ascending: true })
      .limit(12);

    if (error) {
      return NextResponse.json({ results: [], error: error.message });
    }

    const results = (students || []).map((s) => ({
      id: s.id,
      name: s.name,
      father_name: s.father_name || "",
      roll_no: s.roll_no,
      admission_no: s.admission_no,
      className: classNameOf(s.sections),
    }));

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error searching";
    return NextResponse.json({ results: [], error: msg }, { status: 500 });
  }
}

