import { AppChrome } from "@/components/app-chrome";
import { PageHeading } from "@/components/page-heading";

export type ShellRole = "principal" | "finance" | "teacher";

/** Title + padded body. Sidebar comes from AppChrome in the role layout. */
export function Shell({
  title,
  children,
}: {
  role?: ShellRole;
  readOnly?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeading title={title} />
      <div className="space-y-4 p-4 md:p-8">{children}</div>
    </>
  );
}

export function ShellStandalone({
  role,
  title,
  children,
}: {
  role: ShellRole;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AppChrome role={role}>
      <Shell title={title}>{children}</Shell>
    </AppChrome>
  );
}
