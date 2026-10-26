"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLatestAnnouncementInfo } from "@/lib/actions";
import { broadcastAnnouncementRead } from "@/lib/announcement-events";

const EVENT_NAME = "sms_announcement_unread_state";

function getStorageKey(userId?: string | null, role?: string | null) {
  if (userId) return `sms_announcements_last_read_${userId}`;
  if (role) return `sms_announcements_last_read_${role}`;
  return "sms_announcements_last_read";
}

export function AnnouncementSync({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);
  const lastKnownIdRef = useRef<string | null>(null);

  // User is only considered reading announcements when viewing the announcement feed (NOT on create/make page)
  const isViewingAnnouncements =
    (pathname === `/${role}/announcements` ||
      pathname === "/principal/announcements" ||
      pathname === "/finance/announcements" ||
      pathname === "/teacher/announcements") &&
    !pathname.includes("/make");

  // Helper to mark announcements as read for this user
  const markAsRead = useCallback(() => {
    try {
      const key = getStorageKey(currentUserIdRef.current, role);
      localStorage.setItem(key, new Date().toISOString());
      setHasUnread(false);
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: { hasUnread: false, userId: currentUserIdRef.current, role },
        })
      );
      broadcastAnnouncementRead(currentUserIdRef.current, role);
    } catch {
      /* ignore storage errors */
    }
  }, [role]);

  // Check latest announcement compared to this user's last read timestamp
  const checkLatest = useCallback(async () => {
    try {
      const res = await getLatestAnnouncementInfo();
      if (!res?.ok || !res.latestAt) {
        setHasUnread(false);
        window.dispatchEvent(
          new CustomEvent(EVENT_NAME, {
            detail: { hasUnread: false, userId: res?.userId, role },
          })
        );
        return;
      }

      if (res.userId) {
        currentUserIdRef.current = res.userId;
      }

      const key = getStorageKey(res.userId, role);
      const lastReadStr = localStorage.getItem(key);
      const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0;
      const announcementTime = new Date(res.latestAt).getTime();

      const isNew = announcementTime > lastReadTime;

      // If user is currently viewing the announcements feed, auto-refresh on new item and mark as read
      if (lastKnownIdRef.current && res.id && lastKnownIdRef.current !== res.id && isViewingAnnouncements) {
        router.refresh();
      }
      lastKnownIdRef.current = res.id;

      if (isViewingAnnouncements) {
        markAsRead();
      } else {
        setHasUnread(isNew);
        window.dispatchEvent(
          new CustomEvent(EVENT_NAME, {
            detail: { hasUnread: isNew, userId: res.userId, role },
          })
        );
      }
    } catch {
      /* ignore */
    }
  }, [role, isViewingAnnouncements, markAsRead, router]);

  // If user is on the announcements page, mark as read
  useEffect(() => {
    if (isViewingAnnouncements) {
      markAsRead();
    }
  }, [pathname, isViewingAnnouncements, markAsRead]);

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
            // Check immediately on real-time insert in database
            checkLatest();
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
            checkLatest();
          } else if (ev.data?.type === "ANNOUNCEMENT_READ") {
            if (ev.data.userId && currentUserIdRef.current && ev.data.userId === currentUserIdRef.current) {
              setHasUnread(false);
              window.dispatchEvent(
                new CustomEvent(EVENT_NAME, {
                  detail: { hasUnread: false, userId: ev.data.userId, role },
                })
              );
            }
          } else if (ev.data?.type === "ROLE_CHANGED") {
            if (ev.data.role && ev.data.role !== role) {
              router.refresh();
            }
          }
        };
      } catch {
        /* ignore */
      }
    }

    // 3. Polling every 3 seconds + on window focus + on visibilitychange
    const interval = setInterval(checkLatest, 3000);
    const onFocus = () => checkLatest();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      if (channel) {
        channel.unsubscribe();
      }
      if (bc) {
        bc.close();
      }
    };
  }, [checkLatest, role, router]);

  return null;
}
