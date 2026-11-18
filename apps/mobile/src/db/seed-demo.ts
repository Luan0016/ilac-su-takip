import { todayIso } from '@/src/dates';
import { addWater } from './repo/water';
import { saveMedication } from './repo/medications';

/** Dev-only sample data for the jury demo: three plan types, one of them low on stock. */
export async function seedDemo(): Promise<void> {
  const startDate = todayIso();
  await saveMedication(
    { name: 'Parol', form: 'tablet', doseAmount: 1, doseUnit: 'adet', strength: '500 mg', color: '#1F6FEB', notes: 'Tok karnına', startDate, endDate: null, stockQuantity: 20, refillThresholdDays: 7 },
    [{ type: 'daily', times: ['08:00', '20:00'], weekdays: [], intervalHours: null, anchorTime: null }],
  );
  await saveMedication(
    { name: 'D Vitamini', form: 'capsule', doseAmount: 1, doseUnit: 'adet', strength: '1000 IU', color: '#F2A900', notes: null, startDate, endDate: null, stockQuantity: 30, refillThresholdDays: 7 },
    [{ type: 'weekdays', times: ['09:00'], weekdays: [1, 3, 5], intervalHours: null, anchorTime: null }],
  );
  await saveMedication(
    { name: 'Öksürük Şurubu', form: 'syrup', doseAmount: 5, doseUnit: 'ml', strength: null, color: '#8E44AD', notes: null, startDate, endDate: null, stockQuantity: 40, refillThresholdDays: 3 },
    [{ type: 'interval', times: [], weekdays: [], intervalHours: 8, anchorTime: '08:00' }],
  );
  await addWater(300);
  await addWater(200);
}
