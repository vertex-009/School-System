import Image from "next/image";
import { SCHOOL } from "@/lib/brand";

/**
 * Shared dashboard hero banner:
 * - Left side: Official school crest logo with soft luminous aura and elegant serif typography.
 * - Entire background: Multi-layered soft sky-blue gradient with organic flowing waves.
 * - Center transition: Smooth feathered mask where the blue design gradually dissolves into the school photo seamlessly without any harsh line or solid boundary (matching Pic 2).
 * - Right side: Real school campus photo seamlessly blended.
 * - Box size & height remain 100% unchanged.
 */
export function SchoolHeroBanner() {
  return (
    <section className="shrink-0 overflow-hidden rounded-[1.15rem] border border-[#c5d8eb]/80 shadow-[0_2px_12px_rgba(12,45,94,0.06)]">
      <div className="relative h-[10.75rem] w-full overflow-hidden bg-gradient-to-r from-[#cae4fa] via-[#dcedfb] to-[#e8f3fc] sm:h-[11.5rem] md:h-[12.25rem] lg:h-[13rem]">
        {/* Right panel: Real campus photo smoothly feathered from left into the background */}
        <div
          className="absolute inset-y-0 right-0 z-0 w-[65%] opacity-30 sm:opacity-75 md:opacity-100 sm:w-[62%] md:w-[60%]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 16%, rgba(0,0,0,0.55) 36%, rgba(0,0,0,0.92) 54%, #000 68%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 16%, rgba(0,0,0,0.55) 36%, rgba(0,0,0,0.92) 54%, #000 68%)",
          }}
        >
          <Image
            src={`${SCHOOL.campusSrc}?v=6`}
            alt={`${SCHOOL.name} campus`}
            fill
            priority
            className="object-cover object-[center_48%]"
            sizes="(max-width: 768px) 65vw, 55vw"
          />
        </div>

        {/* Left decorative wave & gradient layer: smoothly fades into transparent in the middle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, #000 0%, #000 28%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 54%, rgba(0,0,0,0.1) 66%, transparent 78%)",
            maskImage:
              "linear-gradient(to right, #000 0%, #000 28%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 54%, rgba(0,0,0,0.1) 66%, transparent 78%)",
          }}
        >
          {/* Ambient rich sky-blue background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(110deg, #bde0fa 0%, #cae6fb 22%, #dcedfb 45%, #ecf6fd 70%, #f4faff 100%)",
            }}
          />

          {/* Soft luminous aura specifically behind the logo */}
          <div
            className="absolute left-[0.75rem] top-1/2 h-44 w-44 -translate-y-1/2 rounded-full sm:left-[1.25rem] sm:h-52 sm:w-52 md:left-[1.75rem] md:h-60 md:w-60 lg:left-[2.25rem] lg:h-68 lg:w-68"
            style={{
              background:
                "radial-gradient(circle, rgba(93, 173, 246, 0.5) 0%, rgba(147, 206, 252, 0.3) 40%, rgba(200, 235, 255, 0.1) 65%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          {/* Flowing decorative wave ribbons spanning across the banner */}
          <svg
            className="absolute inset-y-0 left-0 h-full w-full text-white"
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
          >
            {/* Soft sky-blue wave sweeping behind logo and dipping smoothly */}
            <path
              fill="#62aaf0"
              opacity="0.28"
              d="M0 25 C120 5, 240 60, 360 90 C480 120, 600 135, 740 105 C850 80, 930 95, 1000 115 V220 H0 Z"
            />

            {/* Luminous flowing white ribbon */}
            <path
              fill="#ffffff"
              opacity="0.65"
              d="M0 85 C100 50, 220 95, 340 135 C460 175, 580 160, 700 130 C800 105, 900 120, 1000 145 V220 H0 Z"
            />

            {/* Bottom azure accent wave */}
            <path
              fill="#8ec7f9"
              opacity="0.38"
              d="M0 140 C140 110, 280 155, 420 185 C560 215, 700 190, 840 175 C920 168, 970 178, 1000 188 V220 H0 Z"
            />

            {/* Top gentle arch */}
            <path
              fill="#a7d5fb"
              opacity="0.35"
              d="M0 0 H1000 V30 C900 15, 780 28, 660 18 C520 5, 380 38, 220 25 C120 18, 50 35, 0 22 Z"
            />
          </svg>
        </div>

        {/* Left panel: Official circular logo + school title and motto */}
        <div className="relative z-[2] flex h-full max-w-[85%] sm:max-w-[60%] md:max-w-[48%] lg:max-w-[48%] items-center gap-3 pl-3.5 pr-2 sm:gap-4 sm:pl-5 md:gap-5 md:pl-6 lg:pl-8">
          <div className="relative h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-full bg-[#0a1f4d] shadow-[0_8px_24px_rgba(12,45,94,0.24)] ring-[3px] ring-white sm:h-[5.25rem] sm:w-[5.25rem] md:h-[6rem] md:w-[6rem] lg:h-[6.75rem] lg:w-[6.75rem]">
            <Image
              src={`${SCHOOL.logoSrc}?v=6`}
              alt={`${SCHOOL.shortName} logo`}
              fill
              priority
              className="object-cover object-center"
              sizes="140px"
            />
          </div>
          <div className="min-w-0">
            <h2
              className="text-[1rem] font-bold leading-[1.2] text-[#0b2a56] sm:text-[1.2rem] md:text-[1.4rem] lg:text-[1.55rem]"
              style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
            >
              {SCHOOL.fullName}
            </h2>
            <p className="mt-1 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[#3d6a9a] sm:text-[0.78rem] md:tracking-[0.32em]">
              {SCHOOL.city}
            </p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="h-px w-6 shrink-0 bg-[#0b2a56]/30 sm:w-8" />
              <p
                className="text-[0.7rem] italic text-[#4a6f94] sm:text-[0.78rem] md:text-[0.85rem]"
                style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
              >
                {SCHOOL.motto}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
