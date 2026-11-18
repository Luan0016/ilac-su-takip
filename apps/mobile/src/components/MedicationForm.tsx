import { MEDICATION_FORMS, medicationInputSchema, scheduleInputSchema, type MedicationInput, type ScheduleInput } from '@ilac/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { todayIso } from '@/src/dates';
import { Body, Button, Chip, ErrorText, Field, Row } from './ui';

export const MED_COLORS = ['#1F6FEB', '#E4572E', '#2E7D32', '#8E44AD', '#F2A900', '#00838F'];

type Props = {
  initial?: { med: MedicationInput; schedules: ScheduleInput[] };
  onSubmit: (med: MedicationInput, schedules: ScheduleInput[]) => void;
};

type Values = {
  name: string;
  form: MedicationInput['form'];
  doseAmount: string;
  doseUnit: string;
  strength: string;
  color: string;
  notes: string;
  startDate: string;
  endDate: string;
  planType: ScheduleInput['type'];
  times: string;
  weekdays: number[];
  intervalHours: string;
  anchorTime: string;
  stockQuantity: string;
  refillThresholdDays: string;
};

const STEP_FIELDS: (keyof Values)[][] = [
  ['name', 'form', 'doseAmount', 'doseUnit', 'strength', 'color', 'notes'],
  ['planType', 'times', 'weekdays', 'intervalHours', 'anchorTime', 'startDate', 'endDate'],
  ['stockQuantity', 'refillThresholdDays'],
];

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.trim().replace(',', '.'))); // NaN → schema reports the field
const orNull = (s: string) => (s.trim() === '' ? null : s.trim());
const padTime = (s: string) => (/^\d:\d\d$/.test(s) ? `0${s}` : s);
const str = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

function toValues(initial?: Props['initial']): Values {
  const m = initial?.med;
  const s = initial?.schedules[0];
  return {
    name: m?.name ?? '',
    form: m?.form ?? 'tablet',
    doseAmount: str(m?.doseAmount ?? 1),
    doseUnit: m?.doseUnit ?? 'adet',
    strength: m?.strength ?? '',
    color: m?.color ?? MED_COLORS[0]!,
    notes: m?.notes ?? '',
    startDate: m?.startDate ?? todayIso(),
    endDate: m?.endDate ?? '',
    planType: s?.type ?? 'daily',
    times: s && s.type !== 'interval' ? s.times.join(', ') : '08:00',
    weekdays: s?.weekdays ?? [],
    intervalHours: str(s?.intervalHours ?? 8),
    anchorTime: s?.anchorTime ?? '08:00',
    stockQuantity: str(m?.stockQuantity),
    refillThresholdDays: str(m?.refillThresholdDays ?? 7),
  };
}

function toInputs(v: Values) {
  const med = {
    name: v.name,
    form: v.form,
    doseAmount: num(v.doseAmount),
    doseUnit: v.doseUnit,
    strength: orNull(v.strength),
    color: v.color,
    notes: orNull(v.notes),
    startDate: v.startDate.trim(),
    endDate: orNull(v.endDate),
    stockQuantity: num(v.stockQuantity),
    refillThresholdDays: num(v.refillThresholdDays),
  };
  const schedule =
    v.planType === 'interval'
      ? { type: v.planType, times: [], weekdays: [], intervalHours: num(v.intervalHours), anchorTime: padTime(v.anchorTime.trim()) }
      : {
          type: v.planType,
          times: [...new Set(v.times.split(',').map((t) => padTime(t.trim())).filter(Boolean))].sort(),
          weekdays: v.planType === 'weekdays' ? [...v.weekdays].sort() : [],
          intervalHours: null,
          anchorTime: null,
        };
  return { med, schedule };
}

/** Field → message for every invalid field (empty → "required", otherwise "invalid"). */
function validate(v: Values, t: (k: string) => string) {
  const { med, schedule } = toInputs(v);
  const errors: Partial<Record<keyof Values, string>> = {};
  const medResult = medicationInputSchema.safeParse(med);
  const schedResult = scheduleInputSchema.safeParse(schedule);
  const issues = [...(medResult.success ? [] : medResult.error.issues), ...(schedResult.success ? [] : schedResult.error.issues)];
  for (const issue of issues) {
    const key = issue.path[0] as keyof Values;
    const raw = v[key];
    const empty = raw === undefined || (Array.isArray(raw) ? raw.length === 0 : String(raw).trim() === '');
    errors[key] ??= empty || issue.message === 'required' ? t('common.required') : t('common.invalid');
  }
  return { errors, med: medResult.data, schedule: schedResult.data };
}

export function MedicationForm({ initial, onSubmit }: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => toValues(initial));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const set = <K extends keyof Values>(key: K) => (value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  const advance = () => {
    const result = validate(values, t);
    const stepErrors = Object.fromEntries(Object.entries(result.errors).filter(([k]) => STEP_FIELDS[step]!.includes(k as keyof Values)));
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    if (step < 2) return setStep(step + 1);
    if (result.med && result.schedule) onSubmit(result.med, [result.schedule]);
  };

  const weekdayNames = t('meds.weekdayShort', { returnObjects: true }) as string[];

  return (
    <View style={{ gap: 12 }}>
      <Body muted>{`${step + 1}/3 · ${t(['meds.stepInfo', 'meds.stepPlan', 'meds.stepStock'][step]!)}`}</Body>

      {step === 0 && (
        <>
          <Field label={t('meds.name')} value={values.name} onChangeText={set('name')} error={errors.name} />
          <Body muted>{t('meds.form')}</Body>
          <Row>
            {MEDICATION_FORMS.map((f) => (
              <Chip key={f} label={t(`meds.forms.${f}`)} selected={values.form === f} onPress={() => set('form')(f)} />
            ))}
          </Row>
          <Field label={t('meds.doseAmount')} value={values.doseAmount} onChangeText={set('doseAmount')} keyboardType="decimal-pad" error={errors.doseAmount} />
          <Field label={t('meds.doseUnit')} value={values.doseUnit} onChangeText={set('doseUnit')} error={errors.doseUnit} />
          <Field label={t('meds.strength')} value={values.strength} onChangeText={set('strength')} error={errors.strength} />
          <Body muted>{t('meds.color')}</Body>
          <Row>
            {MED_COLORS.map((color) => (
              <Chip key={color} label={values.color === color ? '✓' : ' '} color={color} selected={values.color === color} onPress={() => set('color')(color)} />
            ))}
          </Row>
          <Field label={t('meds.notes')} value={values.notes} onChangeText={set('notes')} error={errors.notes} />
        </>
      )}

      {step === 1 && (
        <>
          <Body muted>{t('meds.planType')}</Body>
          <Row>
            {(['daily', 'weekdays', 'interval'] as const).map((type) => (
              <Chip key={type} label={t(`meds.planTypes.${type}`)} selected={values.planType === type} onPress={() => set('planType')(type)} />
            ))}
          </Row>
          {values.planType === 'weekdays' && (
            <>
              <Body muted>{t('meds.weekdays')}</Body>
              <Row>
                {weekdayNames.map((name, i) => {
                  const day = i + 1;
                  const on = values.weekdays.includes(day);
                  return <Chip key={day} label={name} selected={on} onPress={() => set('weekdays')(on ? values.weekdays.filter((d) => d !== day) : [...values.weekdays, day])} />;
                })}
              </Row>
              {errors.weekdays ? <ErrorText>{errors.weekdays}</ErrorText> : null}
            </>
          )}
          {values.planType === 'interval' ? (
            <>
              <Field label={t('meds.intervalHours')} value={values.intervalHours} onChangeText={set('intervalHours')} keyboardType="number-pad" error={errors.intervalHours} />
              <Field label={t('meds.anchorTime')} value={values.anchorTime} onChangeText={set('anchorTime')} placeholder="08:00" error={errors.anchorTime} />
            </>
          ) : (
            <Field label={t('meds.times')} value={values.times} onChangeText={set('times')} placeholder="08:00, 20:00" error={errors.times} />
          )}
          <Field label={t('meds.startDate')} value={values.startDate} onChangeText={set('startDate')} error={errors.startDate} />
          <Field label={t('meds.endDate')} value={values.endDate} onChangeText={set('endDate')} error={errors.endDate} />
        </>
      )}

      {step === 2 && (
        <>
          <Field label={t('meds.stockQuantity')} value={values.stockQuantity} onChangeText={set('stockQuantity')} keyboardType="decimal-pad" error={errors.stockQuantity} />
          <Field label={t('meds.refillThresholdDays')} value={values.refillThresholdDays} onChangeText={set('refillThresholdDays')} keyboardType="number-pad" error={errors.refillThresholdDays} />
        </>
      )}

      <Row style={{ justifyContent: 'space-between' }}>
        {step > 0 ? <Button title={t('common.back')} variant="secondary" onPress={() => (setErrors({}), setStep(step - 1))} /> : <View />}
        <Button title={step < 2 ? t('common.next') : t('common.save')} onPress={advance} />
      </Row>
    </View>
  );
}
