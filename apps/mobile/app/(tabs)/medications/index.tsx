import { daysLeft } from '@ilac/shared';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDoseLogs } from '@/src/db/repo/doses';
import { useMedications } from '@/src/db/repo/medications';
import { Body, Button, Card, Screen, useThemeColors } from '@/src/components/ui';

export default function MedicationsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { meds, schedules } = useMedications();
  const logs = useDoseLogs();

  return (
    <Screen>
      <Button title={t('meds.add')} onPress={() => router.push('/medications/edit')} />
      {meds.length === 0 && <Body muted>{t('meds.empty')}</Body>}
      {meds.map((med) => {
        const left = daysLeft(med, schedules.filter((s) => s.medicationId === med.id), logs);
        const low = left !== null && left <= med.refillThresholdDays;
        return (
          <Link key={med.id} href={`/medications/${med.id}`} asChild>
            <Pressable accessibilityRole="button">
              <Card style={styles.row}>
                <View style={[styles.dot, { backgroundColor: med.color }]} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '600' }}>{med.name}</Body>
                  {med.strength ? <Body muted>{med.strength}</Body> : null}
                </View>
                {left !== null && (
                  <View style={[styles.badge, { borderColor: low ? c.warning : c.border }]}>
                    <Body style={{ color: low ? c.warning : c.muted }}>{t('meds.daysLeft', { count: left })}</Body>
                  </View>
                )}
              </Card>
            </Pressable>
          </Link>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
