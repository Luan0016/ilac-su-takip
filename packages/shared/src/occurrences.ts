import type { Medication, Schedule } from './schemas';

const HOUR_MS = 3_600_000;

/** 'YYYY-MM-DD' → local midnight of that day. */
export function localDay(isoDay: string): Date {
  const [y, m, d] = isoDay.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function atTime(day: Date, hhmm: string): Date {
  const [h, min] = hhmm.split(':').map(Number) as [number, number];
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min);
}

/** Planned dose instants in [from, to), ascending, interpreted in the device's local time zone. */
export function occurrencesBetween(med: Medication, schedule: Schedule, from: Date, to: Date): Date[] {
  if (med.archivedAt) return [];
  const start = localDay(med.startDate);
  const endExclusive = med.endDate ? localDay(med.endDate) : null; // endDate day is included
  endExclusive?.setDate(endExclusive.getDate() + 1);

  const lo = Math.max(from.getTime(), start.getTime());
  const hi = Math.min(to.getTime(), endExclusive ? endExclusive.getTime() : Infinity);
  if (lo >= hi) return [];

  const out: Date[] = [];
  if (schedule.type === 'interval') {
    const step = schedule.intervalHours! * HOUR_MS;
    const first = atTime(start, schedule.anchorTime!).getTime();
    for (let t = first + Math.max(0, Math.ceil((lo - first) / step)) * step; t < hi; t += step) out.push(new Date(t));
    return out;
  }

  const lowDay = new Date(lo);
  for (let day = new Date(lowDay.getFullYear(), lowDay.getMonth(), lowDay.getDate()); day.getTime() < hi; day.setDate(day.getDate() + 1)) {
    const isoWeekday = day.getDay() || 7;
    if (schedule.type === 'weekdays' && !schedule.weekdays.includes(isoWeekday)) continue;
    for (const time of schedule.times) {
      const t = atTime(day, time).getTime();
      if (t >= lo && t < hi) out.push(new Date(t));
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}
