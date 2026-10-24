import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCnic, normalizeCnic } from "./cnic";

export interface DuplicateCnicResult {
  isDuplicate: boolean;
  message?: string;
  entityType?: "teacher" | "staff" | "student" | "employee";
  entityName?: string;
}

/**
 * Checks whether a 13-digit CNIC is already registered in the school across
 * profiles (teachers/staff/principal), students, or other_employees.
 */
export async function checkCnicDuplicate(
  supabase: SupabaseClient,
  schoolId: string,
  rawCnic: string,
  options?: {
    excludeProfileId?: string;
    excludeStudentId?: string;
    excludeEmployeeId?: string;
  }
): Promise<DuplicateCnicResult> {
  const cnic = normalizeCnic(rawCnic);
  if (!cnic || cnic.length !== 13) return { isDuplicate: false };

  const formatted = formatCnic(cnic);

  // 1. Check Profiles (teachers, finance, principals)
  let pQuery = supabase
    .from("profiles")
    .select("id, name, role")
    .eq("school_id", schoolId)
    .eq("cnic", cnic);
  if (options?.excludeProfileId) {
    pQuery = pQuery.neq("id", options.excludeProfileId);
  }
  const { data: pMatch } = await pQuery.maybeSingle();
  if (pMatch) {
    const roleLabel =
      pMatch.role === "teacher" ? "Teacher" : pMatch.role === "finance" ? "Finance staff" : "Staff member";
    return {
      isDuplicate: true,
      entityType: pMatch.role === "teacher" ? "teacher" : "staff",
      entityName: pMatch.name,
      message: `CNIC (${formatted}) is already registered for ${roleLabel} "${pMatch.name}". Duplicate CNIC is not allowed.`,
    };
  }

  // 2. Check Students
  let sQuery = supabase
    .from("students")
    .select("id, name, admission_no")
    .eq("school_id", schoolId)
    .eq("cnic", cnic);
  if (options?.excludeStudentId) {
    sQuery = sQuery.neq("id", options.excludeStudentId);
  }
  const { data: sMatch } = await sQuery.maybeSingle();
  if (sMatch) {
    return {
      isDuplicate: true,
      entityType: "student",
      entityName: sMatch.name,
      message: `CNIC (${formatted}) is already registered for Student "${sMatch.name}" (Adm #${sMatch.admission_no}). Duplicate CNIC is not allowed.`,
    };
  }

  // 3. Check Other Employees
  let eQuery = supabase
    .from("other_employees")
    .select("id, name, job_title")
    .eq("school_id", schoolId)
    .eq("cnic", cnic);
  if (options?.excludeEmployeeId) {
    eQuery = eQuery.neq("id", options.excludeEmployeeId);
  }
  const { data: eMatch } = await eQuery.maybeSingle();
  if (eMatch) {
    return {
      isDuplicate: true,
      entityType: "employee",
      entityName: eMatch.name,
      message: `CNIC (${formatted}) is already registered for Employee "${eMatch.name}" (${eMatch.job_title}). Duplicate CNIC is not allowed.`,
    };
  }

  return { isDuplicate: false };
}

