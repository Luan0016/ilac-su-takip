import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MedicationForm } from '@/src/components/MedicationForm';
import { saveMedication, useMedications } from '@/src/db/repo/medications';
import { Body, Screen } from '@/src/components/ui';

/** Add (no id) or edit (?id=) a medication. */
export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();
  const { meds, schedules } = useMedications();
  const med = id ? meds.find((m) => m.id === id) : undefined;

  if (id && !med) return <Screen><Body muted>{t('common.loading')}</Body></Screen>;

  const initial = med && {
    med: {
      name: med.name,
      form: med.form,
      doseAmount: med.doseAmount,
      doseUnit: med.doseUnit,
      strength: med.strength,
      color: med.color,
      notes: med.notes,
      startDate: med.startDate,
      endDate: med.endDate,
      stockQuantity: med.stockQuantity,
      refillThresholdDays: med.refillThresholdDays,
    },
    schedules: schedules.filter((s) => s.medicationId === med.id),
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: med ? med.name : t('meds.add') }} />
      <MedicationForm
        key={med?.id ?? 'new'}
        initial={initial}
        onSubmit={async (input, scheduleInputs) => {
          await saveMedication(input, scheduleInputs, med?.id);
          router.back();
        }}
      />
    </Screen>
  );
}
