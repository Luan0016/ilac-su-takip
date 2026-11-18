import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/src/api/client';
import { Body, Button, Card, Row, Screen, Title } from '@/src/components/ui';
import { seedDemo } from '@/src/db/seed-demo';
import { useSession } from '@/src/store/session';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const session = useSession((s) => s.session);
  const [demoLoaded, setDemoLoaded] = useState(false);

  return (
    <Screen>
      <Card>
        <Title>{t('settings.account')}</Title>
        {session ? (
          <>
            <Body>{t('settings.signedInAs', { email: session.user.email })}</Body>
            <Button title={t('settings.logout')} variant="secondary" onPress={() => void api.logout()} />
          </>
        ) : (
          <Row>
            <Button title={t('settings.login')} onPress={() => router.push('/auth/login')} />
            <Button title={t('settings.register')} variant="secondary" onPress={() => router.push('/auth/register')} />
          </Row>
        )}
      </Card>

      <Card>
        <Button title={t('settings.water')} variant="secondary" onPress={() => router.navigate('/water')} />
        <Body>{`${t('settings.language')}: ${t('settings.languageTr')}`}</Body>
      </Card>

      {__DEV__ && (
        <Button
          title={demoLoaded ? t('settings.demoLoaded') : t('settings.loadDemo')}
          variant="secondary"
          disabled={demoLoaded}
          onPress={() => void seedDemo().then(() => setDemoLoaded(true))}
        />
      )}

      <Body muted>{t('settings.disclaimer')}</Body>
      <Body muted>{t('settings.version', { version: Constants.expoConfig?.version ?? '?' })}</Body>
    </Screen>
  );
}
