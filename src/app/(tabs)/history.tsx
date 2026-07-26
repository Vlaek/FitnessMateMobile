import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TWorkoutSummary } from '@/domain/workouts/types';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { fromCanonicalKg } from '@/domain/units/weight';
import { reportDraftStore } from '@/features/reports/report-draft-store';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { AppHeader } from '@/shared/ui/app-header';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((s) => s.weightUnit);
  const [items, setItems] = useState<TWorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void workoutRepository
        .listCompleted()
        .then(setItems)
        .finally(() => setLoading(false));
    }, []),
  );

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const continueToReport = () => {
    if (selectedIds.length === 0) {
      return;
    }

    reportDraftStore.getState().setWorkoutIds(selectedIds);
    router.push('/reports/new' as Href);
  };

  return (
    <Screen bottomInset="tabBar">
      <View style={styles.header}>
        <AppHeader title={t('history.title')} />
        {!selectionMode && items.length > 0 ? (
          <View style={styles.headerAction}>
            <Button
              label={t('reports.create')}
              variant="secondary"
              onPress={() => setSelectionMode(true)}
            />
          </View>
        ) : null}
      </View>
      {!loading && items.length === 0 ? (
        <EmptyState title={t('history.emptyTitle')} body={t('history.emptyBody')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                selectionMode ? toggleSelection(item.id) : router.push(`/history/${item.id}`)
              }
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedIds.includes(item.id) ? colors.primary : colors.border,
                },
              ]}
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
              {selectionMode && selectedIds.includes(item.id) ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text
                    testID={`history-selection-${item.id}`}
                    style={{ color: colors.primaryText, fontWeight: '800' }}
                  >
                    {selectedIds.indexOf(item.id) + 1}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
      {selectionMode ? (
        <View style={[styles.selectionActions, { borderColor: colors.border }]}>
          <View style={styles.selectionAction}>
            <Button
              label={t('common.continue')}
              disabled={selectedIds.length === 0}
              onPress={continueToReport}
            />
          </View>
          <View style={styles.selectionAction}>
            <Button label={t('common.cancel')} variant="ghost" onPress={cancelSelection} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { gap: 8 },
  headerAction: { paddingHorizontal: 20 },
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
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    padding: 12,
  },
  selectionAction: { flex: 1 },
});
