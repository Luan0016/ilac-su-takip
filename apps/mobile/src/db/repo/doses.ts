import type { DoseLog } from '@ilac/shared';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../client';
import { doseLogs } from '../schema';

export function useDoseLogs(): DoseLog[] {
  const { data } = useLiveQuery(db.select().from(doseLogs));
  return data ?? [];
}
