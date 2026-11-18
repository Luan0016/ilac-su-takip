import { stockAfterEdit, type Medication, type MedicationInput, type Schedule, type ScheduleInput } from '@ilac/shared';
import { eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { newId } from '@/src/id';
import { db } from '../client';
import { doseLogs, medications, schedules } from '../schema';

export function useMedications(): { meds: Medication[]; schedules: Schedule[] } {
  const { data: meds } = useLiveQuery(db.select().from(medications).where(isNull(medications.archivedAt)).orderBy(medications.name));
  const { data: scheds } = useLiveQuery(db.select().from(schedules));
  return { meds: meds ?? [], schedules: scheds ?? [] };
}

/** Creates or updates a medication and replaces its schedules in one transaction; returns its id. */
export async function saveMedication(input: MedicationInput, scheduleInputs: ScheduleInput[], id?: string): Promise<string> {
  const now = new Date().toISOString();
  const medId = id ?? newId();
  db.transaction((tx) => {
    const existing = id ? tx.select().from(medications).where(eq(medications.id, id)).get() : undefined;
    if (existing) {
      const logs = tx.select().from(doseLogs).where(eq(doseLogs.medicationId, medId)).all();
      tx.update(medications)
        .set({ ...input, ...stockAfterEdit(existing, logs, input.stockQuantity, now) })
        .where(eq(medications.id, medId))
        .run();
      tx.delete(schedules).where(eq(schedules.medicationId, medId)).run();
    } else {
      tx.insert(medications).values({ ...input, id: medId, stockSetAt: now, archivedAt: null }).run();
    }
    for (const s of scheduleInputs) tx.insert(schedules).values({ ...s, id: newId(), medicationId: medId }).run();
  });
  return medId;
}

/** "Kutu aldım": new stock counted from now on. */
export async function restock(id: string, quantity: number): Promise<void> {
  db.update(medications).set({ stockQuantity: quantity, stockSetAt: new Date().toISOString() }).where(eq(medications.id, id)).run();
}

export async function archiveMedication(id: string): Promise<void> {
  db.update(medications).set({ archivedAt: new Date().toISOString() }).where(eq(medications.id, id)).run();
}

/** id → name for every medication, archived ones included (history needs them). */
export function useMedicationNames(): Map<string, string> {
  const { data } = useLiveQuery(db.select({ id: medications.id, name: medications.name }).from(medications));
  return new Map((data ?? []).map((m) => [m.id, m.name]));
}
