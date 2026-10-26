import type { Metadata } from "next";
import { SCHOOL } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${SCHOOL.name} · Staff Portal`,
  description: `${SCHOOL.name} & College, Abbottabad — private staff platform for principal, finance, and teachers.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
