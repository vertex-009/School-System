// Real-time cross-tab broadcast and event utilities for announcements and auth

const CHANNEL_NAME = "sms_app_events";

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

export function broadcastNewAnnouncement(title?: string) {
  if (typeof window === "undefined") return;
  const channel = getBroadcastChannel();
  const payload = { type: "NEW_ANNOUNCEMENT", title, timestamp: Date.now() };
  if (channel) {
    channel.postMessage(payload);
    channel.close();
  }
  window.dispatchEvent(new CustomEvent("sms_new_announcement", { detail: payload }));
}

export function broadcastAnnouncementRead() {
  if (typeof window === "undefined") return;
  const channel = getBroadcastChannel();
  const payload = { type: "ANNOUNCEMENT_READ", timestamp: Date.now() };
  if (channel) {
    channel.postMessage(payload);
    channel.close();
  }
  window.dispatchEvent(new CustomEvent("sms_announcement_read", { detail: payload }));
}

export function broadcastAuthRoleChanged(role: string) {
  if (typeof window === "undefined") return;
  const channel = getBroadcastChannel();
  const payload = { type: "ROLE_CHANGED", role, timestamp: Date.now() };
  if (channel) {
    channel.postMessage(payload);
    channel.close();
  }
  window.dispatchEvent(new CustomEvent("sms_auth_changed", { detail: payload }));
}

