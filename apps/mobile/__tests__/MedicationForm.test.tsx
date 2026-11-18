import { fireEvent, render, screen } from '@testing-library/react-native';
import { MedicationForm } from '../src/components/MedicationForm';

const next = () => fireEvent.press(screen.getByText('İleri'));

it('blocks submit when name empty and shows error', async () => {
  const onSubmit = jest.fn();
  await render(<MedicationForm onSubmit={onSubmit} />);
  await next();
  expect(screen.getByText('Bu alan zorunlu')).toBeTruthy();
  expect(screen.getByLabelText('İlaç adı')).toBeTruthy(); // still on step 1
  expect(onSubmit).not.toHaveBeenCalled();
});

it('weekdays plan requires a day selection', async () => {
  await render(<MedicationForm onSubmit={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText('İlaç adı'), 'Parol');
  await next();
  await fireEvent.press(screen.getByText('Belirli günler'));
  await next();
  expect(screen.getByText('Bu alan zorunlu')).toBeTruthy();
  expect(screen.getByText('Pzt')).toBeTruthy(); // still on the plan step
});

it('submits parsed values: doseAmount number, times ["08:00","20:00"]', async () => {
  const onSubmit = jest.fn();
  await render(<MedicationForm onSubmit={onSubmit} />);
  await fireEvent.changeText(screen.getByLabelText('İlaç adı'), 'Parol');
  await fireEvent.changeText(screen.getByLabelText('Her alımda miktar'), '1,5');
  await next();
  await fireEvent.changeText(screen.getByLabelText('Saatler (virgülle, ör. 08:00, 20:00)'), '08:00, 20:00');
  await next();
  await fireEvent.changeText(screen.getByLabelText('Elindeki miktar'), '20');
  await fireEvent.press(screen.getByText('Kaydet'));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  const [med, schedules] = onSubmit.mock.calls[0];
  expect(med).toMatchObject({ name: 'Parol', form: 'tablet', doseAmount: 1.5, doseUnit: 'adet', stockQuantity: 20, refillThresholdDays: 7, endDate: null });
  expect(med.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(schedules).toEqual([{ type: 'daily', times: ['08:00', '20:00'], weekdays: [], intervalHours: null, anchorTime: null }]);
});

it('prefills fields when editing', async () => {
  const onSubmit = jest.fn();
  await render(
    <MedicationForm
      onSubmit={onSubmit}
      initial={{
        med: { name: 'Coraspin', form: 'tablet', doseAmount: 1, doseUnit: 'adet', strength: '100 mg', color: '#E4572E', notes: null, startDate: '2026-11-01', endDate: null, stockQuantity: 30, refillThresholdDays: 5 },
        schedules: [{ type: 'interval', times: [], weekdays: [], intervalHours: 8, anchorTime: '06:00' }],
      }}
    />,
  );
  expect(screen.getByDisplayValue('Coraspin')).toBeTruthy();
  await next();
  expect(screen.getByDisplayValue('8')).toBeTruthy();
  await next();
  await fireEvent.press(screen.getByText('Kaydet'));
  expect(onSubmit.mock.calls[0][1]).toEqual([{ type: 'interval', times: [], weekdays: [], intervalHours: 8, anchorTime: '06:00' }]);
});
