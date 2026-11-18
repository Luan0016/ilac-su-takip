import { loginSchema } from '@ilac/shared';
import { Link, router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/src/api/client';
import { authErrorKey } from '@/src/api/errors';
import { Button, ErrorText, Field, Screen } from '@/src/components/ui';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setError(t('auth.invalid'));
    setBusy(true);
    try {
      await api.login(parsed.data.email, parsed.data.password);
      router.back();
    } catch (e) {
      setError(t(authErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('auth.loginTitle') }} />
      <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      {error && <ErrorText>{error}</ErrorText>}
      <Button title={t('auth.loginTitle')} onPress={submit} disabled={busy} />
      <Link href="/auth/register" replace style={{ textAlign: 'center', paddingVertical: 12 }}>
        {t('auth.noAccount')}
      </Link>
    </Screen>
  );
}
