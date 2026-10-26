import { Fraunces, Manrope } from "next/font/google";

/** Display serif for the school wordmark and major headlines. */
export const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

/** Modern sans for body copy, nav and buttons. */
export const uiFont = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});
