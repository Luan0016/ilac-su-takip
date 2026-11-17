import { describe, expect, it } from 'vitest';
import { averageDailyDoses, currentStock, daysLeft, isLowStock } from './stock';
import { log, med, sched } from './test-utils';

const T = '2026-11-20T10:00:00.000Z';
const at = (hoursFromT: number) => new Date(Date.parse(T) + hoursFromT * 3_600_000).toISOString();

describe('currentStock', () => {
  it('only taken logs after stockSetAt reduce stock', () => {
    const m = med({ stockQuantity: 30, stockSetAt: T });
    const logs = [
      log({ takenAt: at(-1), scheduledAt: at(-1) }),
      log({ takenAt: at(1), scheduledAt: at(1) }),
      log({ status: 'skipped', takenAt: null, scheduledAt: at(2) }),
      log({ status: 'snoozed', takenAt: null, scheduledAt: at(3) }),
    ];
    expect(currentStock(m, logs)).toBe(29);
  });

  it('ignores logs of other medications', () => {
    expect(currentStock(med({ stockSetAt: T }), [log({ medicationId: 'other', takenAt: at(1) })])).toBe(30);
  });

  it('decimal syrup dose', () => {
    const m = med({ stockQuantity: 100, doseAmount: 2.5, doseUnit: 'ml', stockSetAt: T });
    const logs = [1, 2, 3, 4].map((h) => log({ takenAt: at(h), scheduledAt: at(h) }));
    expect(currentStock(m, logs)).toBe(90);
  });

  it('never negative', () => {
    const m = med({ stockQuantity: 1, stockSetAt: T });
    const logs = [1, 2, 3].map((h) => log({ takenAt: at(h), scheduledAt: at(h) }));
    expect(currentStock(m, logs)).toBe(0);
  });
});

describe('averageDailyDoses', () => {
  it('sums all schedule kinds', () => {
    const s = [
      sched({ times: ['08:00', '20:00'] }),
      sched({ type: 'weekdays', weekdays: [1, 3, 5], times: ['09:00'] }),
      sched({ type: 'interval', times: [], intervalHours: 8, anchorTime: '08:00' }),
    ];
    expect(averageDailyDoses(s)).toBeCloseTo(2 + 3 / 7 + 3);
  });
});

describe('daysLeft', () => {
  it('daily 2x', () => {
    expect(daysLeft(med({ stockQuantity: 30 }), [sched({ times: ['08:00', '20:00'] })], [])).toBe(15);
  });
  it('weekdays', () => {
    expect(daysLeft(med({ stockQuantity: 6 }), [sched({ type: 'weekdays', weekdays: [1, 3, 5], times: ['09:00'] })], [])).toBe(14);
  });
  it('interval 8h', () => {
    expect(daysLeft(med({ stockQuantity: 9 }), [sched({ type: 'interval', times: [], intervalHours: 8, anchorTime: '08:00' })], [])).toBe(3);
  });
  it('null without schedules', () => {
    expect(daysLeft(med(), [], [])).toBeNull();
  });
});

describe('isLowStock', () => {
  const today = new Date(2026, 10, 20);
  it('true at threshold', () => {
    expect(isLowStock(med({ stockQuantity: 7 }), [sched()], [], today)).toBe(true);
  });
  it('false above threshold', () => {
    expect(isLowStock(med({ stockQuantity: 8 }), [sched()], [], today)).toBe(false);
  });
  it('false when endDate comes before depletion', () => {
    expect(isLowStock(med({ stockQuantity: 5, endDate: '2026-11-23' }), [sched()], [], today)).toBe(false);
  });
  it('true when endDate is after depletion', () => {
    expect(isLowStock(med({ stockQuantity: 5, endDate: '2026-12-30' }), [sched()], [], today)).toBe(true);
  });
  it('false without schedules', () => {
    expect(isLowStock(med({ stockQuantity: 0 }), [], [], today)).toBe(false);
  });
});
