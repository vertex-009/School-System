export const SCHOOL = {
  name: "City Public School",
  fullName: "City Public School Abbottabad KPK Pakistan",
  city: "Abbottabad, KPK, Pakistan",
  address: "Abbottabad, KPK, Pakistan",
  logoSrc: "/school-logo.jpg",
  bannerSrc: "/school-banner.jpg",
  /** Building photo for dashboard hero (right panel). */
  campusSrc: "/school-campus.jpg",
  shortName: "CPSC",
  motto: "Education is Light",
  printName: "City Public School",
  printLocation: "Abbottabad, KPK, Pakistan",
  printFullName: "City Public School Abbottabad KPK Pakistan",
} as const;

export function getSchoolDisplayName(schoolName?: string | null): string {
  if (!schoolName) return "City Public School";
  const s = schoolName.trim();
  if (
    s.toLowerCase().includes("waqas") ||
    s.toLowerCase() === "school" ||
    !s.toLowerCase().includes("school")
  ) {
    return "City Public School";
  }
  return s;
}

export function getSchoolDisplayAddress(schoolAddress?: string | null): string {
  if (!schoolAddress) return "Abbottabad, KPK, Pakistan";
  const a = schoolAddress.trim();
  if (a.toLowerCase().includes("abbotabad") || a.toLowerCase().includes("abbottabad")) {
    return "Abbottabad, KPK, Pakistan";
  }
  return a || "Abbottabad, KPK, Pakistan";
}
