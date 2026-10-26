"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function AnnouncementDot({ className = "" }: { className?: string }) {
  const [hasUnread, setHasUnread] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const isFeed = pathname.includes("/announcements") && !pathname.includes("/make");
    if (isFeed) {
      setHasUnread(false);
    }

    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ hasUnread: boolean }>;
      if (typeof custom.detail?.hasUnread === "boolean") {
        setHasUnread(isFeed ? false : custom.detail.hasUnread);
      }
    };
    window.addEventListener("sms_announcement_unread_state", handler);
    return () => window.removeEventListener("sms_announcement_unread_state", handler);
  }, [pathname]);

  if (!hasUnread) return null;

  return (
    <span className={`relative flex h-2.5 w-2.5 shrink-0 ${className}`} title="New Announcement">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-80" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
    </span>
  );
}
