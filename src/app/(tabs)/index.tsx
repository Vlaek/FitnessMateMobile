import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/shared/ui/app-header';
import { Screen } from '@/shared/ui/screen';
import { useAppTheme } from '@/shared/theme/use-app-theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <Screen bottomInset="tabBar">
      <AppHeader title={t('home.title')} actionLabel={t('settings.title')} onAction={() => router.push('/settings')} />
      <View style={styles.content}>
        <Text style={[styles.greeting, { color: colors.text }]}>{t('home.greeting')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted }}>{t('home.noWorkouts')}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ content: { padding: 20, gap: 18 }, greeting: { fontSize: 24, fontWeight: '800' }, card: { borderWidth: 1, borderRadius: 18, padding: 20 } });
