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
    <div className="w-full max-w-full min-w-0">
      <PageHeading title={title} actions={headingActions} />
      <div
        className={
          fillViewport
            ? "flex min-h-[calc(100dvh-3.25rem)] w-full max-w-full min-w-0 flex-col gap-3 p-3 pb-8 md:min-h-[calc(100dvh-3.5rem)] md:gap-3.5 md:p-4 lg:gap-4 lg:px-5 lg:py-4 lg:pb-8"
            : "w-full max-w-full min-w-0 space-y-3 p-3 pb-8 md:space-y-3.5 md:p-4 lg:px-5 lg:py-4 lg:pb-8"
        }
      >
        {children}
      </div>
    </div>
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
