import { dosesForDay, isLowStock } from '@ilac/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DoseCard } from '@/src/components/DoseCard';
import { LowStockBanner } from '@/src/components/LowStockBanner';
import { Body, Screen, Title } from '@/src/components/ui';
import { clearDoseStatus, setDoseStatus, useDoseLogs } from '@/src/db/repo/doses';
import { useMedications } from '@/src/db/repo/medications';

/** Re-renders every minute so "late" labels and the day roll over without reopening the app. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const now = useNow();
  const { meds, schedules } = useMedications();
  const logs = useDoseLogs();
  const doses = dosesForDay(meds, schedules, logs, now);
  const lowStock = meds.filter((m) => isLowStock(m, schedules.filter((s) => s.medicationId === m.id), logs, now));

  return (
    <Screen>
      <Title>{now.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</Title>
      <LowStockBanner meds={lowStock} />
      {doses.length === 0 && <Body muted>{t('today.empty')}</Body>}
      {doses.map((dose) => (
        <DoseCard
          key={`${dose.medication.id}|${dose.scheduledAt.toISOString()}`}
          dose={dose}
          now={now}
          onTake={() => setDoseStatus(dose.medication.id, dose.scheduledAt, 'taken')}
          onSkip={() => setDoseStatus(dose.medication.id, dose.scheduledAt, 'skipped')}
          onUndo={() => clearDoseStatus(dose.medication.id, dose.scheduledAt)}
        />
      ))}
    </Screen>
  );
}
