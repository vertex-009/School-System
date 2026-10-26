"use client";

import { MotionConfig } from "framer-motion";
import "@/styles/landing.css";
import { displayFont, uiFont } from "./fonts";
import { LandingNav } from "./nav";
import { Hero } from "./hero";
import { MottoRibbon } from "./motto-ribbon";
import { Roles } from "./roles";
import { Platform } from "./platform";
import { Campus } from "./campus";
import { FinalCta, IdentityStrip, LandingFooter } from "./closing";
import { ScrollProgress } from "./scroll-progress";

/** Public staff landing page for `/`. Sign-in itself lives at `/login`. */
export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className={`landing-root ${displayFont.variable} ${uiFont.variable} font-ui`}>
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-white px-4 py-2 font-semibold text-brand-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <LandingNav />
        <main id="main">
          <Hero />
          <MottoRibbon />
          <Roles />
          <Platform />
          <Campus />
          <IdentityStrip />
          <FinalCta />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
