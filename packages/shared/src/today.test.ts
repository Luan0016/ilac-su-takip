import { describe, expect, it } from 'vitest';
import { dosesForDay, waterTotalForDay } from './today';
import { log, med, sched } from './test-utils';

const day = new Date(2026, 10, 20);
const iso = (h: number, m = 0) => new Date(2026, 10, 20, h, m).toISOString();

describe('dosesForDay', () => {
  const a = med({ id: 'a', name: 'A' });
  const b = med({ id: 'b', name: 'B' });
  const schedules = [
    sched({ id: 's1', medicationId: 'a', times: ['20:00', '08:00'] }),
    sched({ id: 's2', medicationId: 'b', times: ['12:00'] }),
  ];

  it('merges occurrences of two meds sorted by time', () => {
    const r = dosesForDay([a, b], schedules, [], day);
    expect(r.map((d) => `${d.medication.id}@${d.scheduledAt.getHours()}`)).toEqual(['a@8', 'b@12', 'a@20']);
    expect(r.every((d) => d.log === null)).toBe(true);
  });

  it('attaches matching log by medicationId+scheduledAt', () => {
    const taken = log({ medicationId: 'a', scheduledAt: iso(8), takenAt: iso(8, 5) });
    const other = log({ medicationId: 'b', scheduledAt: iso(8), takenAt: iso(8, 5) }); // same time, other med → extra dose of b
    const r = dosesForDay([a, b], schedules, [taken], day);
    expect(r[0]!.log).toBe(taken);
    expect(r.filter((d) => d.log).length).toBe(1);
    expect(dosesForDay([a, b], schedules, [other], day).length).toBe(4);
  });

  it('includes extra dose log not in schedule', () => {
    const extra = log({ medicationId: 'b', scheduledAt: iso(15, 30), takenAt: iso(15, 30) });
    const r = dosesForDay([a, b], schedules, [extra], day);
    expect(r.map((d) => d.scheduledAt.getHours())).toEqual([8, 12, 15, 20]);
    expect(r[2]!.log).toBe(extra);
  });

  it('ignores logs from other days and of unknown medications', () => {
    const yesterday = log({ medicationId: 'b', scheduledAt: new Date(2026, 10, 19, 15).toISOString() });
    const unknown = log({ medicationId: 'zzz', scheduledAt: iso(9) });
    expect(dosesForDay([a, b], schedules, [yesterday, unknown], day).length).toBe(3);
  });
});

describe('waterTotalForDay', () => {
  it('counts only that local day', () => {
    const logs = [
      { id: '1', amountMl: 200, loggedAt: new Date(2026, 10, 19, 23, 50).toISOString() },
      { id: '2', amountMl: 300, loggedAt: new Date(2026, 10, 20, 0, 10).toISOString() },
      { id: '3', amountMl: 500, loggedAt: new Date(2026, 10, 20, 23, 59).toISOString() },
      { id: '4', amountMl: 250, loggedAt: new Date(2026, 10, 21, 0, 0).toISOString() },
    ];
    expect(waterTotalForDay(logs, day)).toBe(800);
  });
});
