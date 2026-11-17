import { localDay } from './occurrences';
import type { DoseLog, Medication, Schedule } from './schemas';

const DAY_MS = 86_400_000;

/** Stock derived from the last restock minus doses taken after it; never below 0. */
export function currentStock(med: Medication, logs: DoseLog[]): number {
  const since = Date.parse(med.stockSetAt);
  const used = logs
    .filter((l) => l.medicationId === med.id && l.status === 'taken' && l.takenAt !== null && Date.parse(l.takenAt) > since)
    .reduce((sum, l) => sum + med.doseAmount, 0);
  return Math.max(0, med.stockQuantity - used);
}

export function averageDailyDoses(schedules: Schedule[]): number {
  return schedules.reduce((sum, s) => {
    if (s.type === 'daily') return sum + s.times.length;
    if (s.type === 'weekdays') return sum + (s.times.length * s.weekdays.length) / 7;
    return sum + 24 / s.intervalHours!;
  }, 0);
}

export function daysLeft(med: Medication, schedules: Schedule[], logs: DoseLog[]): number | null {
  const perDay = averageDailyDoses(schedules) * med.doseAmount;
  if (perDay === 0) return null;
  return Math.floor(currentStock(med, logs) / perDay);
}

/** Low when days left ≤ threshold, unless the treatment ends before the stock runs out. */
export function isLowStock(med: Medication, schedules: Schedule[], logs: DoseLog[], today: Date): boolean {
  const left = daysLeft(med, schedules, logs);
  if (left === null || left > med.refillThresholdDays) return false;
  if (med.endDate) {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const treatmentDaysLeft = Math.round((localDay(med.endDate).getTime() - startOfToday.getTime()) / DAY_MS) + 1;
    if (treatmentDaysLeft <= left) return false;
  }
  return true;
}
