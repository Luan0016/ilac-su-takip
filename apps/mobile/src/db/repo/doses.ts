import type { DoseLog } from '@ilac/shared';
import { and, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { newId } from '@/src/id';
import { db } from '../client';
import { doseLogs } from '../schema';

export function useDoseLogs(): DoseLog[] {
  const { data } = useLiveQuery(db.select().from(doseLogs));
  return data ?? [];
}

/** One row per (medication, planned time): pressing twice updates, never duplicates. */
export async function setDoseStatus(medicationId: string, scheduledAt: Date, status: 'taken' | 'skipped'): Promise<void> {
  const takenAt = status === 'taken' ? new Date().toISOString() : null;
  db.insert(doseLogs)
    .values({ id: newId(), medicationId, scheduledAt: scheduledAt.toISOString(), status, takenAt, snoozedUntil: null })
    .onConflictDoUpdate({ target: [doseLogs.medicationId, doseLogs.scheduledAt], set: { status, takenAt, snoozedUntil: null } })
    .run();
}

/** "Geri al": the dose is pending again and, if it was taken, the stock comes back. */
export async function clearDoseStatus(medicationId: string, scheduledAt: Date): Promise<void> {
  db.delete(doseLogs)
    .where(and(eq(doseLogs.medicationId, medicationId), eq(doseLogs.scheduledAt, scheduledAt.toISOString())))
    .run();
}

/** A dose outside the plan, taken now. */
export async function logExtraDose(medicationId: string): Promise<void> {
  const now = new Date().toISOString();
  db.insert(doseLogs).values({ id: newId(), medicationId, scheduledAt: now, status: 'taken', takenAt: now, snoozedUntil: null }).onConflictDoNothing().run();
}
