import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Body, useThemeColors } from './ui';

const SIZES = { sm: 96, lg: 200 } as const;

export function WaterRing({ totalMl, goalMl, size = 'lg' }: { totalMl: number; goalMl: number; size?: 'sm' | 'lg' }) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const percent = Math.min(100, Math.round((totalMl / goalMl) * 100));
  const px = SIZES[size];
  const stroke = size === 'lg' ? 16 : 10;
  const r = (px - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <View style={[styles.wrap, { width: px, height: px }]} accessibilityLabel={`%${percent}`}>
      <Svg width={px} height={px} style={StyleSheet.absoluteFill}>
        <Circle cx={px / 2} cy={px / 2} r={r} stroke={c.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke={c.tint}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - percent / 100)}
          transform={`rotate(-90 ${px / 2} ${px / 2})`}
        />
      </Svg>
      <Body style={{ fontSize: size === 'lg' ? 32 : 18, fontWeight: '700' }}>{`%${percent}`}</Body>
      <Body muted style={{ fontSize: size === 'lg' ? 14 : 11 }}>{t('water.progress', { total: totalMl, goal: goalMl })}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
