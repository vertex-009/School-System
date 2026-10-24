import { AppChrome } from "@/components/app-chrome";
import { PageHeading } from "@/components/page-heading";

export type ShellRole = "principal" | "finance" | "teacher";

/** Title + padded body. Sidebar comes from AppChrome in the role layout. */
export function Shell({
  title,
  headingActions,
  fillViewport,
  children,
}: {
  role?: ShellRole;
  readOnly?: boolean;
  title: string;
  headingActions?: React.ReactNode;
  /** Fit content in remaining viewport (no page scroll). */
  fillViewport?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeading title={title} actions={headingActions} />
      <div
        className={
          fillViewport
            ? "flex h-[calc(100dvh-3.25rem)] flex-col gap-2 overflow-hidden p-3 pb-3.5 md:h-[calc(100dvh-3.5rem)] md:gap-2.5 md:p-3.5 md:pb-4 lg:px-5 lg:py-2.5 lg:pb-4"
            : "space-y-2.5 p-3 md:space-y-3 md:p-4 lg:px-5 lg:py-4"
        }
      >
        {children}
      </div>
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
