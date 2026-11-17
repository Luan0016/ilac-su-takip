import { waterSettingsSchema } from '@ilac/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable } from 'react-native';

import { CupButtons } from '@/src/components/CupButtons';
import { Body, Button, Card, ErrorText, Field, Row, Screen, Title } from '@/src/components/ui';
import { WaterRing } from '@/src/components/WaterRing';
import { hhmm } from '@/src/dates';
import { addWater, deleteWater, saveWaterSettings, useWaterToday } from '@/src/db/repo/water';

export default function WaterScreen() {
  const { t } = useTranslation();
  const { totalMl, logs, settings } = useWaterToday();

  const confirmDelete = (id: string, ml: number) =>
    Alert.alert(`${ml} ml`, t('common.delete') + '?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void deleteWater(id) },
    ]);

  return (
    <Screen>
      <WaterRing totalMl={totalMl} goalMl={settings.dailyGoalMl} />
      <CupButtons sizes={settings.cupSizesMl} onAdd={addWater} />

      <Card>
        <Body style={{ fontWeight: '600' }}>{t('water.todayLogs')}</Body>
        {logs.length === 0 ? <Body muted>{t('water.empty')}</Body> : <Body muted>{t('water.deleteHint')}</Body>}
        {logs.map((l) => (
          <Pressable key={l.id} onLongPress={() => confirmDelete(l.id, l.amountMl)} accessibilityRole="button" accessibilityHint={t('water.deleteHint')}>
            <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
              <Body>{hhmm(new Date(l.loggedAt))}</Body>
              <Body>{`${l.amountMl} ml`}</Body>
            </Row>
          </Pressable>
        ))}
      </Card>

      <WaterSettingsForm settings={settings} />
    </Screen>
  );
}

function WaterSettingsForm({ settings }: { settings: ReturnType<typeof useWaterToday>['settings'] }) {
  const { t } = useTranslation();
  const toForm = () => ({
    dailyGoalMl: String(settings.dailyGoalMl),
    wakeTime: settings.wakeTime,
    sleepTime: settings.sleepTime,
    intervalMinutes: String(settings.intervalMinutes),
    cupSizesMl: settings.cupSizesMl.join(', '),
  });
  const [form, setForm] = useState(toForm);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  // Re-sync when the stored row loads or changes elsewhere (e.g. onboarding).
  useEffect(() => setForm(toForm()), [settings.dailyGoalMl, settings.wakeTime, settings.sleepTime, settings.intervalMinutes, settings.cupSizesMl.join(',')]);

  const set = (key: keyof typeof form) => (v: string) => (setSaved(false), setForm((f) => ({ ...f, [key]: v })));

  const save = async () => {
    const parsed = waterSettingsSchema.safeParse({
      dailyGoalMl: Number(form.dailyGoalMl),
      wakeTime: form.wakeTime.trim(),
      sleepTime: form.sleepTime.trim(),
      intervalMinutes: Number(form.intervalMinutes),
      cupSizesMl: form.cupSizesMl.split(',').map((s) => Number(s.trim())).filter((n) => n > 0),
      enabled: settings.enabled,
    });
    setError(!parsed.success);
    if (!parsed.success) return;
    await saveWaterSettings(parsed.data);
    setSaved(true);
  };

  return (
    <Card>
      <Title>{t('water.settings')}</Title>
      <Field label={t('water.dailyGoal')} value={form.dailyGoalMl} onChangeText={set('dailyGoalMl')} keyboardType="number-pad" />
      <Field label={t('water.wakeTime')} value={form.wakeTime} onChangeText={set('wakeTime')} />
      <Field label={t('water.sleepTime')} value={form.sleepTime} onChangeText={set('sleepTime')} />
      <Field label={t('water.interval')} value={form.intervalMinutes} onChangeText={set('intervalMinutes')} keyboardType="number-pad" />
      <Field label={t('water.cupSizes')} value={form.cupSizesMl} onChangeText={set('cupSizesMl')} />
      {error && <ErrorText>{t('common.invalid')}</ErrorText>}
      <Button title={saved ? '✓' : t('common.save')} onPress={save} />
    </Card>
  );
}
