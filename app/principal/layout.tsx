import { AppChrome } from "@/components/app-chrome";
import { requireRoleCookie } from "@/lib/session";

export default async function PrincipalLayout({ children }: { children: React.ReactNode }) {
  await requireRoleCookie("principal");
  return <AppChrome role="principal">{children}</AppChrome>;
}
