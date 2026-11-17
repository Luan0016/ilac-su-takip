import { describe, expect, it } from 'vitest';
import { occurrencesBetween } from './occurrences';
import { med, sched } from './test-utils';

// local-time day range [00:00, next 00:00)
const day = (y: number, m: number, d: number): [Date, Date] => [new Date(y, m - 1, d), new Date(y, m - 1, d + 1)];
const hhmm = (dates: Date[]) => dates.map((d) => `${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);

describe('occurrencesBetween', () => {
  it('daily_two_times', () => {
    const r = occurrencesBetween(med(), sched({ times: ['20:00', '08:00'] }), ...day(2026, 11, 20));
    expect(hhmm(r)).toEqual(['20 08:00', '20 20:00']);
  });

  it('weekdays_sunday_iso7', () => {
    const s = sched({ type: 'weekdays', weekdays: [7], times: ['09:00'] });
    expect(hhmm(occurrencesBetween(med(), s, ...day(2026, 11, 22)))).toEqual(['22 09:00']); // Pazar
    expect(occurrencesBetween(med(), s, ...day(2026, 11, 23))).toEqual([]); // Pazartesi
  });

  it('interval_crosses_midnight', () => {
    const m = med({ startDate: '2026-11-20' });
    const s = sched({ type: 'interval', times: [], intervalHours: 8, anchorTime: '08:00' });
    expect(hhmm(occurrencesBetween(m, s, ...day(2026, 11, 20)))).toEqual(['20 08:00', '20 16:00']);
    expect(hhmm(occurrencesBetween(m, s, ...day(2026, 11, 21)))).toEqual(['21 00:00', '21 08:00', '21 16:00']);
  });

  it('interval far after start skips ahead arithmetically', () => {
    const m = med({ startDate: '2026-01-01' });
    const s = sched({ type: 'interval', times: [], intervalHours: 6, anchorTime: '03:00' });
    expect(hhmm(occurrencesBetween(m, s, ...day(2026, 11, 20)))).toEqual(['20 03:00', '20 09:00', '20 15:00', '20 21:00']);
  });

  it('respects_start_and_end_date', () => {
    expect(occurrencesBetween(med({ startDate: '2026-11-21' }), sched({}), ...day(2026, 11, 20))).toEqual([]);
    const ending = med({ endDate: '2026-11-25' });
    expect(hhmm(occurrencesBetween(ending, sched({}), ...day(2026, 11, 25)))).toEqual(['25 08:00']);
    expect(occurrencesBetween(ending, sched({}), ...day(2026, 11, 26))).toEqual([]);
  });

  it('archived medication yields nothing', () => {
    expect(occurrencesBetween(med({ archivedAt: '2026-11-10T00:00:00.000Z' }), sched({}), ...day(2026, 11, 20))).toEqual([]);
  });

  it('range spanning 3 days returns sorted union', () => {
    const r = occurrencesBetween(med(), sched({ times: ['21:00', '07:30'] }), new Date(2026, 10, 20), new Date(2026, 10, 23));
    expect(hhmm(r)).toEqual(['20 07:30', '20 21:00', '21 07:30', '21 21:00', '22 07:30', '22 21:00']);
  });

  it('from is inclusive and to is exclusive', () => {
    const r = occurrencesBetween(med(), sched({ times: ['08:00'] }), new Date(2026, 10, 20, 8, 0), new Date(2026, 10, 21, 8, 0));
    expect(hhmm(r)).toEqual(['20 08:00']);
  });
});
