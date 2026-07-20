import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/shared/theme/use-app-theme';

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View testID="database-error" style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('app.databaseError')}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.retry')} onPress={onRetry}
        style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 18, textAlign: 'center' }, button: { minHeight: 48, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
});
