import { AppChrome } from "@/components/app-chrome";
import { requireRoleCookie } from "@/lib/session";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  await requireRoleCookie("finance");
  return <AppChrome role="finance">{children}</AppChrome>;
}
