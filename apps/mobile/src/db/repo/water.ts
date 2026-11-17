import { DEFAULT_WATER_SETTINGS, waterTotalForDay, type WaterLog, type WaterSettings } from '@ilac/shared';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { newId } from '@/src/id';
import { db, WATER_SETTINGS_ID } from '../client';
import { waterLogs, waterSettings } from '../schema';

type StoredSettings = WaterSettings & { onboarded: boolean };

export function useWaterSettings(): StoredSettings {
  const { data } = useLiveQuery(db.select().from(waterSettings).where(eq(waterSettings.id, WATER_SETTINGS_ID)));
  const row = data?.[0];
  return row ? { ...row } : { ...DEFAULT_WATER_SETTINGS, onboarded: true };
}

export function useWaterLogs(): WaterLog[] {
  const { data } = useLiveQuery(db.select().from(waterLogs).orderBy(desc(waterLogs.loggedAt)));
  return data ?? [];
}

export function useWaterToday(now = new Date()): { totalMl: number; logs: WaterLog[]; settings: StoredSettings } {
  const all = useWaterLogs();
  const settings = useWaterSettings();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const logs = all.filter((l) => Date.parse(l.loggedAt) >= start && Date.parse(l.loggedAt) < start + 86_400_000);
  return { totalMl: waterTotalForDay(all, now), logs, settings };
}

export async function addWater(amountMl: number): Promise<void> {
  db.insert(waterLogs).values({ id: newId(), amountMl, loggedAt: new Date().toISOString() }).run();
}

export async function deleteWater(id: string): Promise<void> {
  db.delete(waterLogs).where(eq(waterLogs.id, id)).run();
}

export async function saveWaterSettings(s: WaterSettings): Promise<void> {
  db.update(waterSettings).set(s).where(eq(waterSettings.id, WATER_SETTINGS_ID)).run();
}
