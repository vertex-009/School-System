import { DAY_NAMES, periodStartTime } from "@/lib/timetable/time";

export type TimetableCell = {
  day_of_week: number;
  period_number: number;
  subject_name?: string;
  teacher_name?: string;
  section_label?: string;
  room_number?: number;
};

type Props = {
  workingDays: number;
  periodsPerDay: number;
  dayStart: string;
  periodMinutes: number;
  breakAfterPeriod: number;
  breakMinutes: number;
  cells: TimetableCell[];
  title?: string;
  emptyLabel?: string;
};

export function TimetableGrid({
  workingDays,
  periodsPerDay,
  dayStart,
  periodMinutes,
  breakAfterPeriod,
  breakMinutes,
  cells,
  title,
  emptyLabel = "—",
}: Props) {
  const map = new Map<string, TimetableCell>();
  for (const c of cells) map.set(`${c.day_of_week}-${c.period_number}`, c);

  return (
    <div className="overflow-x-auto">
      {title && <p className="mb-2 text-sm font-bold text-slate-800">{title}</p>}
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50">
            <th className="border p-2 text-left">Period</th>
            {Array.from({ length: workingDays }, (_, i) => (
              <th key={i} className="border p-2">
                {DAY_NAMES[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: periodsPerDay }, (_, pi) => {
            const period = pi + 1;
            const time = periodStartTime(dayStart, period, periodMinutes, breakAfterPeriod, breakMinutes);
            return (
              <tr key={period}>
                <td className="border p-2 font-bold text-slate-600">
                  P{period}
                  <span className="block text-[10px] font-normal text-slate-400">{time}</span>
                  {breakAfterPeriod === period && (
                    <span className="block text-[10px] font-bold text-amber-600">↓ break {breakMinutes}m</span>
                  )}
                </td>
                {Array.from({ length: workingDays }, (_, di) => {
                  const day = di + 1;
                  const cell = map.get(`${day}-${period}`);
                  return (
                    <td key={day} className="border p-2 align-top">
                      {cell ? (
                        <div>
                          {cell.section_label && <p className="font-bold text-slate-900">{cell.section_label}</p>}
                          <p className="text-slate-700">{cell.subject_name || emptyLabel}</p>
                          {cell.teacher_name && <p className="text-[10px] text-slate-500">{cell.teacher_name}</p>}
                          {cell.room_number != null && cell.room_number > 0 && (
                            <p className="text-[10px] text-slate-400">Room {cell.room_number}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">{emptyLabel}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
