"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveAnnouncement } from "@/lib/actions";
import { broadcastNewAnnouncement } from "@/lib/announcement-events";
import { Shell } from "@/components/shell";
import { Back, Card, Field, Select } from "@/components/ui";

type Teacher = { id: string; name: string };

const OPTIONS = [
  { value: "all", label: "Everyone (all staff)" },
  { value: "finance", label: "Finance" },
  { value: "teachers", label: "All teachers" },
  { value: "teacher", label: "Specific teacher" },
] as const;

export function MakeAnnouncementForm({ teachers }: { teachers: Teacher[] }) {
  const [selected, setSelected] = useState<string[]>(["all"]);
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => {
    const res = await saveAnnouncement(fd);
    if (res?.ok) {
      broadcastNewAnnouncement();
    }
    return res;
  }, null);

  function toggle(value: string) {
    setSelected((cur) => {
      if (value === "all") return cur.includes("all") ? [] : ["all"];
      const withoutAll = cur.filter((v) => v !== "all");
      return withoutAll.includes(value) ? withoutAll.filter((v) => v !== value) : [...withoutAll, value];
    });
  }

  const needsTeacher = selected.includes("teacher");

  return (
    <Shell role="principal" title="Make announcement">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/principal/announcements" label="← Announcements" />
        <Link href="/principal/announcements/history" className="text-xs font-bold text-brand-accent hover:underline">
          View history →
        </Link>
      </div>

      {state?.ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          Announcement published.{" "}
          <Link href="/principal/announcements/history" className="underline">
            See history
          </Link>
        </div>
      )}
      {state?.error && <p className="text-sm font-bold text-rose-600">{state.error}</p>}

      <Card title="New announcement" subtitle="Select one or more recipients (e.g. Finance + teachers together).">
        <form action={action} className="space-y-3">
          <Field label="Title" name="title" required />
          <label className="block text-xs font-bold text-slate-600">
            Body
            <textarea
              name="body"
              required
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
            />
          </label>

          <fieldset>
            <legend className="text-xs font-bold text-slate-600">Send to (select one or more)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {OPTIONS.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <label
                    key={o.value}
                    className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                      on
                        ? "border-brand-navy bg-brand-navy text-white"
                        : "border-slate-200 bg-white text-brand-navy hover:border-brand-sky"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="audience"
                      value={o.value}
                      checked={on}
                      onChange={() => toggle(o.value)}
                      className="sr-only"
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
            {!selected.length && (
              <p className="mt-2 text-xs font-bold text-rose-600">Pick at least one recipient</p>
            )}
          </fieldset>

          {needsTeacher && (
            <Select label="Teacher" name="target_teacher_id" required defaultValue="">
              <option value="" disabled>
                Select teacher
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}

          <button
            type="submit"
            disabled={pending || !selected.length}
            className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-accent disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Publish"}
          </button>
        </form>
      </Card>
    </Shell>
  );
}
