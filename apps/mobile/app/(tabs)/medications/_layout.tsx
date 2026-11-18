import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

// The tab bar already shows "İlaçlar"; the stack adds back navigation for detail and edit.
export default function MedicationsLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('meds.title') }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
      <Stack.Screen name="edit" options={{ title: t('meds.add') }} />
    </Stack>
  );
}
