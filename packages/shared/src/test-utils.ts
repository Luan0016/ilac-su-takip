import type { DoseLog, Medication, Schedule } from './schemas';

export const med = (over: Partial<Medication> = {}): Medication => ({
  id: 'm1',
  name: 'Parol',
  form: 'tablet',
  doseAmount: 1,
  doseUnit: 'adet',
  strength: null,
  color: '#3366FF',
  notes: null,
  startDate: '2026-11-01',
  endDate: null,
  stockQuantity: 30,
  refillThresholdDays: 7,
  stockSetAt: '2026-11-01T00:00:00.000Z',
  archivedAt: null,
  ...over,
});

export const sched = (over: Partial<Schedule> = {}): Schedule => ({
  id: 's1',
  medicationId: 'm1',
  type: 'daily',
  times: ['08:00'],
  weekdays: [],
  intervalHours: null,
  anchorTime: null,
  ...over,
});

export const log = (over: Partial<DoseLog>): DoseLog => ({
  id: Math.random().toString(36).slice(2),
  medicationId: 'm1',
  scheduledAt: '2026-11-20T05:00:00.000Z',
  status: 'taken',
  takenAt: '2026-11-20T05:00:00.000Z',
  snoozedUntil: null,
  ...over,
});
