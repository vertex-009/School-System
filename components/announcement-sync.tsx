"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLatestAnnouncementInfo } from "@/lib/actions";
import { broadcastAnnouncementRead } from "@/lib/announcement-events";

const STORAGE_KEY = "sms_announcements_last_read";
const EVENT_NAME = "sms_announcement_unread_state";

export function AnnouncementSync({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);
  const isAnnouncementsPage = pathname.includes("/announcements");
  const lastKnownIdRef = useRef<string | null>(null);

  // Helper to mark announcements as read
  const markAsRead = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setHasUnread(false);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hasUnread: false } }));
      broadcastAnnouncementRead();
    } catch {
      /* ignore storage errors */
    }
  };

  // If user is currently on an announcements page, immediately mark as read
  useEffect(() => {
    if (isAnnouncementsPage) {
      markAsRead();
    }
  }, [pathname, isAnnouncementsPage]);

  // Check latest announcement compared to last read timestamp
  const checkLatest = async () => {
    try {
      const res = await getLatestAnnouncementInfo();
      if (!res?.ok || !res.latestAt) {
        setHasUnread(false);
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hasUnread: false } }));
        return;
      }

      const lastReadStr = localStorage.getItem(STORAGE_KEY);
      const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0;
      const announcementTime = new Date(res.latestAt).getTime();

      const isNew = announcementTime > lastReadTime;

      // If there is a new announcement that arrived while on the announcements page, refresh page automatically!
      if (lastKnownIdRef.current && res.id && lastKnownIdRef.current !== res.id && isAnnouncementsPage) {
        router.refresh();
      }
      lastKnownIdRef.current = res.id;

      if (isAnnouncementsPage) {
        markAsRead();
      } else {
        setHasUnread(isNew);
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hasUnread: isNew } }));
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    // Initial check
    checkLatest();

    // 1. Supabase Realtime Subscription (postgres_changes on announcements)
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("public-announcements-live")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "announcements",
          },
          () => {
            // New announcement inserted live in Postgres!
            if (isAnnouncementsPage) {
              router.refresh();
              markAsRead();
            } else {
              setHasUnread(true);
              window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hasUnread: true } }));
            }
          }
        )
        .subscribe();
    } catch {
      /* fallback to broadcast & polling */
    }

    // 2. Cross-Tab BroadcastChannel Listener
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("sms_app_events");
        bc.onmessage = (ev) => {
          if (ev.data?.type === "NEW_ANNOUNCEMENT") {
            if (isAnnouncementsPage) {
              router.refresh();
              markAsRead();
            } else {
              setHasUnread(true);
              window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hasUnread: true } }));
            }
          } else if (ev.data?.type === "ANNOUNCEMENT_READ") {
            setHasUnread(false);
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hasUnread: false } }));
          } else if (ev.data?.type === "ROLE_CHANGED") {
            // If another tab logged in as a different role, refresh active tab to sync
            if (ev.data.role && ev.data.role !== role) {
              router.refresh();
            }
          }
        };
      } catch {
        /* ignore */
      }
    }

    // 3. Fallback polling every 5 seconds + on window focus
    const interval = setInterval(checkLatest, 5000);
    const onFocus = () => checkLatest();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      if (channel) {
        channel.unsubscribe();
      }
      if (bc) {
        bc.close();
      }
    };
  }, [isAnnouncementsPage, router, role]);

  return null;
}

