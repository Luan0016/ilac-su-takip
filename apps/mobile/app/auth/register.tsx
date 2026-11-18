import { registerSchema } from '@ilac/shared';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';

import { api } from '@/src/api/client';
import { authErrorKey } from '@/src/api/errors';
import { Body, Button, ErrorText, Field, Row, Screen } from '@/src/components/ui';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = registerSchema.safeParse({ email, password, consent });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      return setError(field === 'consent' ? t('auth.consent') : field === 'password' ? t('auth.password') : t('auth.email'));
    }
    setBusy(true);
    try {
      await api.register(parsed.data.email, parsed.data.password, true);
      router.back();
    } catch (e) {
      setError(t(authErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('auth.registerTitle') }} />
      <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      <Row style={{ flexWrap: 'nowrap' }}>
        <Switch value={consent} onValueChange={setConsent} accessibilityLabel={t('auth.consent')} />
        <Body style={{ flex: 1 }}>{t('auth.consent')}</Body>
      </Row>
      {error && <ErrorText>{error}</ErrorText>}
      <Button title={t('auth.registerTitle')} onPress={submit} disabled={busy} />
    </Screen>
  );
}
