"use client";

import { useActionState, useMemo, useState } from "react";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/actions";
import { broadcastNewAnnouncement } from "@/lib/announcement-events";
import { AnnouncementDot } from "@/components/announcement-dot";
import { MONTHS } from "@/lib/format";

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
  audience: string | null;
  target_teacher_id?: string | null;
  created_by: string | null;
  kind?: string | null;
  fee_month?: number | null;
  fee_year?: number | null;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function FinanceAnnouncementsClient({
  received,
  sent,
  teachersList,
  profileMap,
  currentUserId,
  readOnly,
}: {
  received: AnnouncementItem[];
  sent: AnnouncementItem[];
  teachersList: { id: string; name: string }[];
  profileMap: Record<string, { name: string; role: string }>;
  currentUserId: string;
  readOnly: boolean;
}) {
  // By default, NOTHING is open below ("by default kch ni ana chaye")
  const [activeTab, setActiveTab] = useState<"make" | "history" | null>(null);

  // Form states for "make" tab
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(["teachers"]);
  const [targetTeacherId, setTargetTeacherId] = useState("");
  const [kind, setKind] = useState<"general" | "fee_open">("general");
  const now = useMemo(() => new Date(), []);
  const [feeMonth, setFeeMonth] = useState(now.getMonth() + 1);
  const [feeYear, setFeeYear] = useState(now.getFullYear());
  const [formSuccess, setFormSuccess] = useState(false);

  const [state, formAction, pending] = useActionState(async (_: unknown, fd: FormData) => {
    const res = await saveAnnouncement(fd);
    if (res?.ok) {
      broadcastNewAnnouncement();
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setActiveTab("history");
      }, 1000);
    }
    return res;
  }, null);

  const toggleAudience = (val: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const isSpecificTeacherSelected = selectedAudiences.includes("teacher");

  function getSenderDisplay(createdById: string | null | undefined) {
    if (!createdById) return { name: "School Notice", role: "" };
    if (createdById === currentUserId) return { name: "You", role: "Finance" };
    const p = profileMap[createdById];
    if (!p) return { name: "Staff Member", role: "" };
    return { name: p.name, role: p.role };
  }

  function getRecipientDisplay(audience: string | null | undefined, teacherId?: string | null | undefined) {
    if (audience === "teacher") {
      const t = teacherId ? profileMap[teacherId] : null;
      return t ? `Teacher · ${t.name}` : "Specific Teacher";
    }
    switch (audience) {
      case "principal":
        return "Principal";
      case "teachers":
        return "All Teachers";
      case "all":
        return "All Staff";
      default:
        return audience || "Staff";
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#1a5276]/30 bg-gradient-to-r from-[#0b1f3a] via-[#102d54] to-[#1a5276] p-6 sm:p-7 text-white shadow-[0_4px_20px_rgba(11,31,58,0.15)]">
        <div className="relative z-[1] max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-rose-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            Finance Portal · Communications
          </div>
          <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Announcements Management
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-300">
            Publish fee circulars, message specific teachers or staff, and view announcement history.
          </p>
        </div>
      </section>

      {/* Action Buttons: Make Announcement & Announcement History */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
        {/* 1. Make Announcement */}
        <button
          type="button"
          onClick={() => setActiveTab((prev) => (prev === "make" ? null : "make"))}
          className={`group relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all duration-200 text-left cursor-pointer active:scale-[0.99] ${
            activeTab === "make"
              ? "border-rose-400 bg-gradient-to-br from-rose-50 via-white to-pink-50/40 ring-2 ring-rose-400/20 shadow-md"
              : "border-rose-200/90 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/20 hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/25 transition group-hover:scale-105">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span
              className={`flex h-8 items-center justify-center rounded-full px-3 text-xs font-bold transition ${
                activeTab === "make"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white"
              }`}
            >
              {activeTab === "make" ? "Close ▴" : "Open ▾"}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-rose-700">
              Make Announcement
            </h3>
          </div>
        </button>

        {/* 2. Announcement History */}
        <button
          type="button"
          onClick={() => {
            setActiveTab((prev) => {
              const next = prev === "history" ? null : "history";
              if (next === "history") {
                window.dispatchEvent(new CustomEvent("sms_announcements_history_opened"));
              }
              return next;
            });
          }}
          className={`group relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all duration-200 text-left cursor-pointer active:scale-[0.99] ${
            activeTab === "history"
              ? "border-sky-400 bg-gradient-to-br from-sky-50 via-white to-blue-50/40 ring-2 ring-sky-400/20 shadow-md"
              : "border-sky-200/90 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/20 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1f3a] text-white shadow-md shadow-slate-900/25 transition group-hover:scale-105">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span
              className={`flex h-8 items-center justify-center rounded-full px-3 text-xs font-bold transition ${
                activeTab === "history"
                  ? "bg-[#0b1f3a] text-white shadow-xs"
                  : "bg-sky-100 text-sky-800 group-hover:bg-[#0b1f3a] group-hover:text-white"
              }`}
            >
              {activeTab === "history" ? "Close ▴" : "Open ▾"}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-brand-accent">
              Announcement History
            </h3>
            <AnnouncementDot />
          </div>
        </button>
      </div>

      {/* View 1: Make Announcement Form */}
      {activeTab === "make" && (
        <section className="rounded-2xl border border-rose-200/80 bg-white p-5 sm:p-6 shadow-sm transition animate-fadeIn">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </span>
              <h2 className="text-base font-black text-brand-navy">Publish New Announcement</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {formSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              ✓ Announcement published successfully! Loading history...
            </div>
          )}

          {state?.error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {/* Target Audience selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Target Recipients
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: "principal", label: "Principal" },
                  { id: "teachers", label: "All Teachers" },
                  { id: "teacher", label: "Specific Teacher" },
                ].map((aud) => {
                  const isChecked = selectedAudiences.includes(aud.id);
                  return (
                    <label
                      key={aud.id}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold cursor-pointer transition select-none ${
                        isChecked
                          ? "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-400/30"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="audience"
                        value={aud.id}
                        checked={isChecked}
                        onChange={() => toggleAudience(aud.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>{aud.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Specific Teacher Selection Dropdown (if 'teacher' selected) */}
            {isSpecificTeacherSelected && (
              <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-3.5 space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold text-brand-navy">
                  Select Specific Teacher <span className="text-rose-500">*</span>
                </label>
                <select
                  name="target_teacher_id"
                  value={targetTeacherId}
                  onChange={(e) => setTargetTeacherId(e.target.value)}
                  required={isSpecificTeacherSelected}
                  className="w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  This announcement will only be delivered directly to the selected teacher.
                </p>
              </div>
            )}

            {/* Announcement Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Notice Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setKind("general")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    kind === "general"
                      ? "bg-[#0b1f3a] text-white shadow-xs"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  General Notice
                </button>
                <button
                  type="button"
                  onClick={() => setKind("fee_open")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    kind === "fee_open"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Fee Collection Circular
                </button>
              </div>
              <input type="hidden" name="kind" value={kind} />
            </div>

            {/* If fee_open, select month & year */}
            {kind === "fee_open" && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs">
                <span className="font-bold text-rose-900">Fee Period:</span>
                <select
                  name="fee_month"
                  value={feeMonth}
                  onChange={(e) => setFeeMonth(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-800"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  name="fee_year"
                  min={2000}
                  max={2100}
                  value={feeYear}
                  onChange={(e) => setFeeYear(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-800"
                />
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Monthly Fee Submission Circular or Staff Notice"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-400 focus:bg-white focus:ring-1 focus:ring-rose-400"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Announcement Message (SMS / Notice)
              </label>
              <textarea
                name="body"
                required
                rows={4}
                placeholder="Write the message text here..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-rose-400 focus:bg-white focus:ring-1 focus:ring-rose-400 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Publishing..." : "Send Announcement"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* View 2: Announcement History */}
      {activeTab === "history" && (
        <div className="space-y-4 transition animate-fadeIn">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-brand-navy">Notice Board &amp; Archives</h2>
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            >
              ✕ Close History
            </button>
          </div>

          {/* Sent by you Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 text-xs font-bold">
                  📤
                </span>
                <h3 className="text-sm font-extrabold text-[#0b1f3a]">Sent Announcements</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {sent.length} sent
              </span>
            </div>

            <ul className="space-y-4">
              {sent.map((item) => {
                const recipient = getRecipientDisplay(item.audience, item.target_teacher_id);
                const fee = item.kind === "fee_open" && item.fee_month && item.fee_year
                  ? `${MONTHS[item.fee_month - 1]} ${item.fee_year}`
                  : null;

                return (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 shadow-2xs transition hover:border-slate-300"
                  >
                    {/* Header: Recipient Name Bold + Time + Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">To:</span>
                        <b className="text-sm font-black text-[#0b1f3a]">{recipient}</b>
                        {fee && (
                          <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Fee {fee}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatDate(item.created_at)}
                        </span>
                        {!readOnly && (
                          <form action={deleteAnnouncement.bind(null, item.id)}>
                            <button
                              type="submit"
                              className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {/* Announcement Title */}
                    <div className="mt-3">
                      <h4 className="text-sm sm:text-base font-extrabold text-[#0b1f3a]">
                        {item.title}
                      </h4>
                    </div>

                    {/* Message Box underneath */}
                    <div className="mt-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal shadow-2xs">
                      {item.body}
                    </div>
                  </li>
                );
              })}
              {!sent.length && (
                <p className="py-6 text-center text-xs text-slate-400">You have not sent any announcements yet.</p>
              )}
            </ul>
          </div>

          {/* Received Announcements Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 text-xs font-bold">
                  📥
                </span>
                <h3 className="text-sm font-extrabold text-[#0b1f3a]">Received Announcements</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {received.length} received
              </span>
            </div>

            <ul className="space-y-4">
              {received.map((item) => {
                const sender = getSenderDisplay(item.created_by);
                const fee = item.kind === "fee_open" && item.fee_month && item.fee_year
                  ? `${MONTHS[item.fee_month - 1]} ${item.fee_year}`
                  : null;

                return (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 shadow-2xs transition hover:border-slate-300"
                  >
                    {/* Header: Sender Name Bold + Role + Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">From:</span>
                        <b className="text-sm font-black text-[#0b1f3a]">{sender.name}</b>
                        {sender.role && (
                          <span className="rounded-full bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 capitalize">
                            {sender.role}
                          </span>
                        )}
                        {fee && (
                          <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Fee {fee}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* Announcement Title */}
                    <div className="mt-3">
                      <h4 className="text-sm sm:text-base font-extrabold text-[#0b1f3a]">
                        {item.title}
                      </h4>
                    </div>

                    {/* Message Box underneath */}
                    <div className="mt-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal shadow-2xs">
                      {item.body}
                    </div>
                  </li>
                );
              })}
              {!received.length && (
                <p className="py-6 text-center text-xs text-slate-400">No announcements received for Finance yet.</p>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
