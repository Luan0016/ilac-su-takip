import type { DayDose, Medication } from '@ilac/shared';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DoseCard } from '../src/components/DoseCard';

const med: Medication = {
  id: 'm1',
  name: 'Parol',
  form: 'tablet',
  doseAmount: 1,
  doseUnit: 'adet',
  strength: '500 mg',
  color: '#1F6FEB',
  notes: null,
  startDate: '2026-11-01',
  endDate: null,
  stockQuantity: 20,
  refillThresholdDays: 7,
  stockSetAt: '2026-11-01T00:00:00.000Z',
  archivedAt: null,
};

const at = (h: number, m = 0) => new Date(2026, 10, 20, h, m);
const handlers = () => ({ onTake: jest.fn(), onSkip: jest.fn(), onUndo: jest.fn() });

it('pending card shows time and Aldım/Atla; pressing Aldım calls onTake', async () => {
  const h = handlers();
  await render(<DoseCard dose={{ medication: med, scheduledAt: at(8), log: null }} now={at(7)} {...h} />);
  expect(screen.getByText('08:00')).toBeTruthy();
  expect(screen.getByText('Parol')).toBeTruthy();
  expect(screen.queryByText('gecikti')).toBeNull();
  await fireEvent.press(screen.getByText('Aldım'));
  expect(h.onTake).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('Atla'));
  expect(h.onSkip).toHaveBeenCalledTimes(1);
});

it('taken card shows taken time and Geri al', async () => {
  const h = handlers();
  const dose: DayDose = {
    medication: med,
    scheduledAt: at(8),
    log: { id: 'l1', medicationId: 'm1', scheduledAt: at(8).toISOString(), status: 'taken', takenAt: at(8, 12).toISOString(), snoozedUntil: null },
  };
  await render(<DoseCard dose={dose} now={at(9)} {...h} />);
  expect(screen.getByText('08:12 alındı')).toBeTruthy();
  expect(screen.queryByText('Aldım')).toBeNull();
  await fireEvent.press(screen.getByText('Geri al'));
  expect(h.onUndo).toHaveBeenCalledTimes(1);
});

it('skipped card shows Atlandı and Geri al', async () => {
  const dose: DayDose = {
    medication: med,
    scheduledAt: at(8),
    log: { id: 'l1', medicationId: 'm1', scheduledAt: at(8).toISOString(), status: 'skipped', takenAt: null, snoozedUntil: null },
  };
  await render(<DoseCard dose={dose} now={at(9)} {...handlers()} />);
  expect(screen.getByText('Atlandı')).toBeTruthy();
  expect(screen.getByText('Geri al')).toBeTruthy();
});

it('pending card past its time shows "gecikti"', async () => {
  await render(<DoseCard dose={{ medication: med, scheduledAt: at(8), log: null }} now={at(8, 30)} {...handlers()} />);
  expect(screen.getByText('gecikti')).toBeTruthy();
});
