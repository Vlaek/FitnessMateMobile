import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/shared/theme/use-app-theme';

export function LoadingScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View
      testID="database-loading"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={{ color: colors.text }}>{t('app.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
