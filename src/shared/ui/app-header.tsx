import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/use-app-theme';

export function AppHeader({ title, actionLabel, onAction }: {
  title: string; actionLabel?: string; onAction?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction}
          style={[styles.action, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.text, fontSize: 20 }}>⚙</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 62, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '900' }, action: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
