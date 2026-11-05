import type { Metadata } from "next";
import { SCHOOL } from "@/lib/brand";
import { TopLoader } from "@/components/top-loader";
import "./globals.css";

export const metadata: Metadata = {
  title: `${SCHOOL.name} · Staff Portal`,
  description: `${SCHOOL.name} & College, Abbottabad — private staff platform for principal, finance, and teachers.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopLoader />
        {children}
      </body>
    </html>
  );
}
