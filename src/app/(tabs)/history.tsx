import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TWorkoutSummary } from '@/domain/workouts/types';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { fromCanonicalKg } from '@/domain/units/weight';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { AppHeader } from '@/shared/ui/app-header';
import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((s) => s.weightUnit);
  const [items, setItems] = useState<TWorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void workoutRepository
        .listCompleted()
        .then(setItems)
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <Screen bottomInset="tabBar">
      <AppHeader title={t('history.title')} />
      {!loading && items.length === 0 ? (
        <EmptyState title={t('history.emptyTitle')} body={t('history.emptyBody')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/history/${item.id}`)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.textMuted }}>
                  {new Date(item.completedAt).toLocaleString()}
                </Text>
              </View>
              <View>
                <Text style={{ color: colors.text }}>
                  {item.setCount} {t('programs.sets')}
                </Text>
                <Text style={{ color: colors.textMuted }}>
                  {t('history.volume')}: {fromCanonicalKg(item.volumeKg, unit)} {unit}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  list: { padding: 20, gap: 12, paddingBottom: 90 },
  card: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  name: { fontSize: 18, fontWeight: '800' },
});
