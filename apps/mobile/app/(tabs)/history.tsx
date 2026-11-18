import { waterTotalForDay } from '@ilac/shared';
import { useTranslation } from 'react-i18next';

import { Body, Card, Row, Screen } from '@/src/components/ui';
import { hhmm, todayIso } from '@/src/dates';
import { useDoseLogs } from '@/src/db/repo/doses';
import { useMedicationNames } from '@/src/db/repo/medications';
import { useWaterLogs } from '@/src/db/repo/water';

const DAYS = 14;

// shortcut: plain list of the last 14 days; charts and adherence % come in M3.
export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const logs = useDoseLogs();
  const water = useWaterLogs();
  const names = useMedicationNames();
  const today = new Date();

  const days = Array.from({ length: DAYS }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
  const sections = days
    .map((day) => {
      const key = todayIso(day);
      const dayLogs = logs
        .filter((l) => todayIso(new Date(l.scheduledAt)) === key)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      return { day, dayLogs, waterMl: waterTotalForDay(water, day) };
    })
    .filter((s) => s.dayLogs.length > 0 || s.waterMl > 0);

  return (
    <Screen>
      {sections.length === 0 && <Body muted>{t('history.empty')}</Body>}
      {sections.map(({ day, dayLogs, waterMl }) => (
        <Card key={day.toISOString()}>
          <Body style={{ fontWeight: '700' }}>{day.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</Body>
          {dayLogs.map((l) => (
            <Row key={l.id} style={{ justifyContent: 'space-between' }}>
              <Body>{`${hhmm(new Date(l.scheduledAt))} · ${names.get(l.medicationId) ?? '?'}`}</Body>
              <Body muted>{t(`history.status.${l.status}`)}</Body>
            </Row>
          ))}
          {waterMl > 0 && <Body muted>{t('history.water', { total: waterMl })}</Body>}
        </Card>
      ))}
    </Screen>
  );
}
