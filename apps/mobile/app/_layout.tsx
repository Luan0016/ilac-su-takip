import '@/src/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import migrations from '@/drizzle/migrations';
import { db, ensureWaterSettings } from '@/src/db/client';
import { useSession } from '@/src/store/session';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [ready, setReady] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!success) return;
    Promise.all([ensureWaterSettings(), useSession.getState().hydrate()])
      .then(() => setReady(true))
      .finally(() => SplashScreen.hideAsync());
  }, [success]);

  if (error) {
    SplashScreen.hideAsync();
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Veritabanı hazırlanamadı: {error.message}</Text>
      </View>
    );
  }
  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
