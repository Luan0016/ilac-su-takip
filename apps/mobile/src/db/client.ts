import { DEFAULT_WATER_SETTINGS } from '@ilac/shared';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// enableChangeListener lets useLiveQuery re-render screens when rows change.
export const sqlite = openDatabaseSync('ilac.db', { enableChangeListener: true });
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export const WATER_SETTINGS_ID = 'default';

/** Creates the single water settings row on first launch. */
export async function ensureWaterSettings(): Promise<void> {
  await db
    .insert(schema.waterSettings)
    .values({ id: WATER_SETTINGS_ID, ...DEFAULT_WATER_SETTINGS, onboarded: false })
    .onConflictDoNothing();
}
