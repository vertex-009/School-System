import type { Metadata } from "next";
import { SCHOOL } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${SCHOOL.name} · Portal`,
  description: `${SCHOOL.fullName}, ${SCHOOL.city} — school management portal`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
