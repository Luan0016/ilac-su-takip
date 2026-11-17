import type { Medication } from '@ilac/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Body, Card, useThemeColors } from './ui';

/** Lists low-stock medications; tapping opens the first one's detail. */
export function LowStockBanner({ meds }: { meds: Medication[] }) {
  const { t } = useTranslation();
  const c = useThemeColors();
  if (meds.length === 0) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/medications/${meds[0]!.id}`)}>
      <Card style={{ borderColor: c.warning }}>
        <Body style={{ color: c.warning, fontWeight: '600' }}>{t('today.lowStock', { names: meds.map((m) => m.name).join(', ') })}</Body>
      </Card>
    </Pressable>
  );
}
