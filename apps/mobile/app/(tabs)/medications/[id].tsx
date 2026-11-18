import { currentStock, daysLeft, parseQuantity, type Schedule } from '@ilac/shared';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { logExtraDose, useDoseLogs } from '@/src/db/repo/doses';
import { archiveMedication, restock, useMedications } from '@/src/db/repo/medications';
import { Body, Button, Card, Field, Row, Screen, Title } from '@/src/components/ui';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { meds, schedules } = useMedications();
  const logs = useDoseLogs();
  const [restockValue, setRestockValue] = useState('');
  const med = meds.find((m) => m.id === id);

  if (!med) return <Screen><Body muted>{t('meds.notFound')}</Body></Screen>;

  const medSchedules = schedules.filter((s) => s.medicationId === med.id);
  const stock = currentStock(med, logs);
  const left = daysLeft(med, medSchedules, logs);
  const weekdayNames = t('meds.weekdayShort', { returnObjects: true }) as string[];

  const describe = (s: Schedule) => {
    if (s.type === 'daily') return t('meds.planDaily', { times: s.times.join(', ') });
    if (s.type === 'weekdays') return t('meds.planWeekdays', { days: s.weekdays.map((d) => weekdayNames[d - 1]).join(', '), times: s.times.join(', ') });
    return t('meds.planInterval', { hours: s.intervalHours, anchor: s.anchorTime });
  };

  const submitRestock = async () => {
    const quantity = parseQuantity(restockValue);
    if (quantity === null) return;
    await restock(med.id, quantity);
    setRestockValue('');
  };

  const confirmArchive = () =>
    Alert.alert(med.name, t('meds.archive') + '?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('meds.archive'), style: 'destructive', onPress: () => void archiveMedication(med.id).then(() => router.back()) },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: med.name }} />
      <Title>{med.name}</Title>
      {med.strength ? <Body muted>{med.strength}</Body> : null}
      <Body>{`${t(`meds.forms.${med.form}`)} · ${med.doseAmount} ${med.doseUnit}`}</Body>
      {med.notes ? <Body muted>{med.notes}</Body> : null}

      <Card>
        <Body style={{ fontWeight: '600' }}>{t('meds.plans')}</Body>
        {medSchedules.map((s) => <Body key={s.id}>{describe(s)}</Body>)}
      </Card>

      <Card>
        <Body style={{ fontWeight: '600' }}>{t('meds.currentStock')}</Body>
        <Body>{`${stock} ${med.doseUnit}${left !== null ? ` · ${t('meds.daysLeft', { count: left })}` : ''}`}</Body>
        <Field label={t('meds.restockPrompt')} value={restockValue} onChangeText={setRestockValue} keyboardType="decimal-pad" />
        <Button title={t('meds.restock')} variant="secondary" onPress={submitRestock} />
      </Card>

      <Button title={t('meds.extraDose')} variant="secondary" onPress={() => logExtraDose(med.id)} />

      <Row>
        <Button title={t('common.edit')} variant="secondary" onPress={() => router.push({ pathname: '/medications/edit', params: { id: med.id } })} />
        <Button title={t('meds.archive')} variant="danger" onPress={confirmArchive} />
      </Row>
    </Screen>
  );
}
