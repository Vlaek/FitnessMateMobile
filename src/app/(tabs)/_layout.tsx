import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/shared/theme/use-app-theme';

import { TAB_ROUTES } from './tab-config';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(7, insets.bottom),
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: styles.label,
      }}
    >
      {TAB_ROUTES.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title: t(route.translationKey),
            tabBarIcon: ({ color }) => route.prominent ? (
              <View style={[styles.startIcon, { backgroundColor: colors.primary }]}>
                <Text style={[styles.startText, { color: colors.primaryText }]}>{route.icon}</Text>
              </View>
            ) : <Text style={[styles.icon, { color }]}>{route.icon}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600' }, icon: { fontSize: 22 },
  startIcon: { width: 44, height: 44, marginTop: -15, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 30, lineHeight: 32, fontWeight: '500' },
});
