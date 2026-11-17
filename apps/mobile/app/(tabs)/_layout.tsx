import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type IconName = SymbolViewProps['name'];

const TABS: { name: string; key: string; icon: IconName }[] = [
  { name: 'index', key: 'tabs.today', icon: { ios: 'sun.max', android: 'today', web: 'today' } },
  { name: 'medications', key: 'tabs.medications', icon: { ios: 'pills', android: 'medication', web: 'medication' } },
  { name: 'water', key: 'tabs.water', icon: { ios: 'drop', android: 'water_drop', web: 'water_drop' } },
  { name: 'history', key: 'tabs.history', icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } },
  { name: 'settings', key: 'tabs.settings', icon: { ios: 'gearshape', android: 'settings', web: 'settings' } },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: Colors[colorScheme].tint }}>
      {TABS.map(({ name, key, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(key),
            tabBarIcon: ({ color }) => <SymbolView name={icon} tintColor={color} size={26} />,
          }}
        />
      ))}
    </Tabs>
  );
}
