import { SCHOOL as BASE } from "@/lib/brand";

/** Landing-facing brand copy — short labels for wordmark/hero; assets from shared brand. */
export const SCHOOL = {
  name: BASE.name,
  fullName: "City Public School & College",
  city: "Abbottabad",
  logoSrc: BASE.logoSrc,
  campusSrc: BASE.campusSrc,
  shortName: BASE.shortName,
  motto: BASE.motto,
} as const;
