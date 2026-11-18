import type { DayDose } from '@ilac/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { hhmm } from '@/src/dates';
import { Body, Button, Card, Row, useThemeColors } from './ui';

type Props = { dose: DayDose; now: Date; onTake: () => void; onSkip: () => void; onUndo: () => void };

export function DoseCard({ dose, now, onTake, onSkip, onUndo }: Props) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { medication: med, scheduledAt, log } = dose;
  const status = log?.status;
  const late = !log && scheduledAt.getTime() < now.getTime();

  return (
    <Card style={{ borderLeftWidth: 6, borderLeftColor: med.color, opacity: status ? 0.75 : 1 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Body style={{ fontSize: 18, fontWeight: '700' }}>{hhmm(scheduledAt)}</Body>
        {late && <Body style={{ color: c.warning, fontWeight: '600' }}>{t('today.late')}</Body>}
      </Row>
      <View>
        <Body style={{ fontWeight: '600' }}>{med.name}</Body>
        <Body muted>{`${med.doseAmount} ${med.doseUnit}${med.strength ? ` · ${med.strength}` : ''}`}</Body>
      </View>
      {status === 'taken' && log?.takenAt && <Body style={{ color: c.success }}>{t('today.takenAt', { time: hhmm(new Date(log.takenAt)) })}</Body>}
      {status === 'skipped' && <Body muted>{t('today.skipped')}</Body>}
      <Row>
        {status ? (
          <Button title={t('today.undo')} variant="secondary" onPress={onUndo} />
        ) : (
          <>
            <Button title={t('today.take')} onPress={onTake} style={{ flex: 1 }} />
            <Button title={t('today.skip')} variant="secondary" onPress={onSkip} />
          </>
        )}
      </Row>
    </Card>
  );
}
