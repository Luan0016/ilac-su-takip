import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm');
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

export const MEDICATION_FORMS = ['tablet', 'capsule', 'syrup', 'drops', 'injection', 'cream', 'other'] as const;
export type MedicationFormKind = (typeof MEDICATION_FORMS)[number];

export const DOSE_STATUSES = ['taken', 'skipped', 'snoozed', 'missed'] as const;
export type DoseStatus = (typeof DOSE_STATUSES)[number];

export const medicationInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    form: z.enum(MEDICATION_FORMS),
    doseAmount: z.number().positive(),
    doseUnit: z.string().trim().min(1).max(20),
    strength: z.string().trim().max(50).nullable(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    notes: z.string().max(500).nullable(),
    startDate: isoDay,
    endDate: isoDay.nullable(),
    stockQuantity: z.number().min(0),
    refillThresholdDays: z.number().int().min(0).max(90).default(7),
  })
  .refine((m) => m.endDate === null || m.endDate >= m.startDate, { path: ['endDate'], message: 'endDate < startDate' });

export type MedicationInput = z.infer<typeof medicationInputSchema>;
export type Medication = MedicationInput & { id: string; stockSetAt: string; archivedAt: string | null };

export const scheduleInputSchema = z
  .object({
    type: z.enum(['daily', 'weekdays', 'interval']),
    times: z.array(hhmm),
    weekdays: z.array(z.number().int().min(1).max(7)),
    intervalHours: z.number().int().min(1).max(24).nullable(),
    anchorTime: hhmm.nullable(),
  })
  .superRefine((s, ctx) => {
    if (s.type !== 'interval' && s.times.length === 0) ctx.addIssue({ code: 'custom', path: ['times'], message: 'required' });
    if (s.type === 'weekdays' && s.weekdays.length === 0) ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'required' });
    if (s.type === 'interval' && (s.intervalHours === null || s.anchorTime === null))
      ctx.addIssue({ code: 'custom', path: ['intervalHours'], message: 'required' });
  });

export type ScheduleInput = z.infer<typeof scheduleInputSchema>;
export type Schedule = ScheduleInput & { id: string; medicationId: string };

export type DoseLog = {
  id: string;
  medicationId: string;
  scheduledAt: string;
  status: DoseStatus;
  takenAt: string | null;
  snoozedUntil: string | null;
};

export type WaterLog = { id: string; amountMl: number; loggedAt: string };

export const waterSettingsSchema = z.object({
  dailyGoalMl: z.number().int().min(250).max(10000),
  wakeTime: hhmm,
  sleepTime: hhmm,
  intervalMinutes: z.number().int().min(15).max(480),
  cupSizesMl: z.array(z.number().int().min(10).max(2000)).min(1).max(6),
  enabled: z.boolean(),
});

export type WaterSettings = z.infer<typeof waterSettingsSchema>;

export const DEFAULT_WATER_SETTINGS: WaterSettings = {
  dailyGoalMl: 2000,
  wakeTime: '08:00',
  sleepTime: '23:00',
  intervalMinutes: 90,
  cupSizesMl: [200, 300, 500],
  enabled: true,
};

const email = z.string().trim().toLowerCase().pipe(z.email());

export const loginSchema = z.object({ email, password: z.string().min(1).max(200) });
export const registerSchema = z.object({ email, password: z.string().min(8).max(200), consent: z.literal(true) });
