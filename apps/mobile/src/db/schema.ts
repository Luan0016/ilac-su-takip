import type { DoseStatus, MedicationFormKind, ScheduleInput } from '@ilac/shared';
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Days are 'YYYY-MM-DD'; instants are ISO 8601 UTC text. Column names mirror the shared types.

export const medications = sqliteTable('medications', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  form: text('form').$type<MedicationFormKind>().notNull(),
  doseAmount: real('dose_amount').notNull(),
  doseUnit: text('dose_unit').notNull(),
  strength: text('strength'),
  color: text('color').notNull(),
  notes: text('notes'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  stockQuantity: real('stock_quantity').notNull(),
  stockSetAt: text('stock_set_at').notNull(),
  refillThresholdDays: integer('refill_threshold_days').notNull().default(7),
  archivedAt: text('archived_at'),
});

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  medicationId: text('medication_id')
    .notNull()
    .references(() => medications.id, { onDelete: 'cascade' }),
  type: text('type').$type<ScheduleInput['type']>().notNull(),
  times: text('times', { mode: 'json' }).$type<string[]>().notNull(),
  weekdays: text('weekdays', { mode: 'json' }).$type<number[]>().notNull(),
  intervalHours: integer('interval_hours'),
  anchorTime: text('anchor_time'),
});

export const doseLogs = sqliteTable(
  'dose_logs',
  {
    id: text('id').primaryKey(),
    medicationId: text('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    scheduledAt: text('scheduled_at').notNull(),
    status: text('status').$type<DoseStatus>().notNull(),
    takenAt: text('taken_at'),
    snoozedUntil: text('snoozed_until'),
  },
  (t) => [uniqueIndex('dose_logs_med_time').on(t.medicationId, t.scheduledAt)],
);

export const waterLogs = sqliteTable('water_logs', {
  id: text('id').primaryKey(),
  amountMl: integer('amount_ml').notNull(),
  loggedAt: text('logged_at').notNull(),
});

export const waterSettings = sqliteTable('water_settings', {
  id: text('id').primaryKey(), // always 'default': one row per device
  dailyGoalMl: integer('daily_goal_ml').notNull(),
  wakeTime: text('wake_time').notNull(),
  sleepTime: text('sleep_time').notNull(),
  intervalMinutes: integer('interval_minutes').notNull(),
  cupSizesMl: text('cup_sizes_ml', { mode: 'json' }).$type<number[]>().notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull(),
  onboarded: integer('onboarded', { mode: 'boolean' }).notNull().default(false),
});
