import { describe, expect, it } from 'vitest';
import { medicationInputSchema, registerSchema, scheduleInputSchema } from './schemas';

const validMed = {
  name: 'Parol',
  form: 'tablet',
  doseAmount: 1,
  doseUnit: 'adet',
  strength: '500 mg',
  color: '#3366FF',
  notes: null,
  startDate: '2026-11-20',
  endDate: null,
  stockQuantity: 20,
  refillThresholdDays: 7,
};

const daily = { type: 'daily', times: ['08:00'], weekdays: [], intervalHours: null, anchorTime: null };

describe('medicationInputSchema', () => {
  it('accepts a valid medication', () => {
    expect(medicationInputSchema.safeParse(validMed).success).toBe(true);
  });
  it('rejects non-positive doseAmount', () => {
    expect(medicationInputSchema.safeParse({ ...validMed, doseAmount: 0 }).success).toBe(false);
  });
  it('accepts decimal doseAmount for syrup', () => {
    expect(medicationInputSchema.safeParse({ ...validMed, form: 'syrup', doseAmount: 2.5, doseUnit: 'ml' }).success).toBe(true);
  });
  it('rejects endDate before startDate', () => {
    expect(medicationInputSchema.safeParse({ ...validMed, startDate: '2026-12-10', endDate: '2026-12-01' }).success).toBe(false);
  });
  it('defaults refillThresholdDays to 7', () => {
    const { refillThresholdDays, ...rest } = validMed;
    expect(medicationInputSchema.parse(rest).refillThresholdDays).toBe(7);
  });
  it('rejects a non-hex color', () => {
    expect(medicationInputSchema.safeParse({ ...validMed, color: 'blue' }).success).toBe(false);
  });
});

describe('scheduleInputSchema', () => {
  it('accepts a daily schedule', () => {
    expect(scheduleInputSchema.safeParse(daily).success).toBe(true);
  });
  it('daily requires at least one HH:mm time', () => {
    expect(scheduleInputSchema.safeParse({ ...daily, times: [] }).success).toBe(false);
  });
  it('weekdays requires days within 1..7', () => {
    expect(scheduleInputSchema.safeParse({ ...daily, type: 'weekdays', weekdays: [0] }).success).toBe(false);
  });
  it('weekdays requires at least one day', () => {
    expect(scheduleInputSchema.safeParse({ ...daily, type: 'weekdays', weekdays: [] }).success).toBe(false);
  });
  it('interval requires intervalHours 1..24 and anchorTime', () => {
    expect(scheduleInputSchema.safeParse({ type: 'interval', times: [], weekdays: [], intervalHours: 8, anchorTime: null }).success).toBe(false);
    expect(scheduleInputSchema.safeParse({ type: 'interval', times: [], weekdays: [], intervalHours: 0, anchorTime: '08:00' }).success).toBe(false);
    expect(scheduleInputSchema.safeParse({ type: 'interval', times: [], weekdays: [], intervalHours: 8, anchorTime: '08:00' }).success).toBe(true);
  });
  it('rejects time "25:00"', () => {
    expect(scheduleInputSchema.safeParse({ ...daily, times: ['25:00'] }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('rejects password shorter than 8', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '1234567', consent: true }).success).toBe(false);
  });
  it('lowercases email', () => {
    expect(registerSchema.parse({ email: 'A@B.com', password: '12345678', consent: true }).email).toBe('a@b.com');
  });
  it('requires consent true', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '12345678', consent: false }).success).toBe(false);
  });
});
