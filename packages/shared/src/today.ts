import { occurrencesBetween } from './occurrences';
import type { DoseLog, Medication, Schedule, WaterLog } from './schemas';

export type DayDose = { medication: Medication; scheduledAt: Date; log: DoseLog | null };

function dayBounds(day: Date): [number, number] {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return [start.getTime(), end.getTime()];
}

/** Planned doses of the local day with their logs, plus logged doses outside the plan (extra doses). */
export function dosesForDay(meds: Medication[], schedules: Schedule[], logs: DoseLog[], day: Date): DayDose[] {
  const [start, end] = dayBounds(day);
  const key = (medId: string, t: number) => `${medId}|${t}`;
  const logByKey = new Map<string, DoseLog>();
  for (const l of logs) {
    const t = Date.parse(l.scheduledAt);
    if (t >= start && t < end) logByKey.set(key(l.medicationId, t), l);
  }

  const out: DayDose[] = [];
  for (const med of meds) {
    for (const s of schedules) {
      if (s.medicationId !== med.id) continue;
      for (const at of occurrencesBetween(med, s, new Date(start), new Date(end))) {
        const k = key(med.id, at.getTime());
        out.push({ medication: med, scheduledAt: at, log: logByKey.get(k) ?? null });
        logByKey.delete(k);
      }
    }
  }
  const medById = new Map(meds.map((m) => [m.id, m]));
  for (const l of logByKey.values()) {
    const medication = medById.get(l.medicationId);
    if (medication) out.push({ medication, scheduledAt: new Date(l.scheduledAt), log: l });
  }
  return out.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

export function waterTotalForDay(logs: WaterLog[], day: Date): number {
  const [start, end] = dayBounds(day);
  return logs.reduce((sum, l) => {
    const t = Date.parse(l.loggedAt);
    return t >= start && t < end ? sum + l.amountMl : sum;
  }, 0);
}
