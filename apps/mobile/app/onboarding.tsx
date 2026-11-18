import { DEFAULT_WATER_SETTINGS } from '@ilac/shared';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Body, Button, ErrorText, Field, Screen, Title } from '@/src/components/ui';
import { completeOnboarding } from '@/src/db/repo/water';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(String(DEFAULT_WATER_SETTINGS.dailyGoalMl));
  const [error, setError] = useState(false);

  const finish = async () => {
    const ml = Number(goal);
    if (!Number.isInteger(ml) || ml < 250 || ml > 10000) return setError(true);
    await completeOnboarding(ml);
    router.replace('/');
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      {step === 0 ? (
        <>
          <Title>{t('onboarding.welcomeTitle')}</Title>
          <Body>{t('onboarding.welcomeBody')}</Body>
          <Body muted>{t('settings.disclaimer')}</Body>
          <Button title={t('common.next')} onPress={() => setStep(1)} />
        </>
      ) : (
        <>
          <Title>{t('onboarding.waterTitle')}</Title>
          <Body muted>{t('onboarding.waterBody')}</Body>
          <Field label={t('water.dailyGoal')} value={goal} onChangeText={setGoal} keyboardType="number-pad" />
          {error && <ErrorText>{t('common.invalid')}</ErrorText>}
          <Button title={t('onboarding.start')} onPress={finish} />
        </>
      )}
    </Screen>
  );
}
