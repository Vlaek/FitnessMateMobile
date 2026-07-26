import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { database } from '@/database/client';
import { fromCanonicalKg } from '@/domain/units/weight';
import {
  calculateAnalytics,
  type Analytics,
  type CompletedSetRow,
} from '@/features/analytics/analytics';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { AppHeader } from '@/shared/ui/app-header';
import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((s) => s.weightUnit);
  const [data, setData] = useState<Analytics | null>(null);
  useFocusEffect(
    useCallback(() => {
      void database
        .getAllAsync<CompletedSetRow>(
          `SELECT w.id AS workoutId, w.completed_at AS completedAt, we.exercise_name AS exerciseName, ws.weight_kg AS weightKg, ws.repetitions FROM workout_sets ws JOIN workout_exercises we ON we.id = ws.workout_exercise_id JOIN workouts w ON w.id = we.workout_id WHERE w.status = 'completed' AND ws.is_completed = 1 ORDER BY w.completed_at`,
        )
        .then((rows) => setData(calculateAnalytics(rows)));
    }, []),
  );

  return (
    <Screen bottomInset="tabBar">
      <AppHeader title={t('progress.title')} />
      {data && data.totalWorkouts > 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.stats}>
            <Stat label={t('progress.totalWorkouts')} value={String(data.totalWorkouts)} />
            <Stat
              label={t('progress.weeklyVolume')}
              value={`${fromCanonicalKg(data.weeklyVolumeKg, unit)} ${unit}`}
            />
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>
            {t('progress.personalRecords')}
          </Text>
          {data.records.map((record) => (
            <View
              key={record.exerciseName}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.name, { color: colors.text }]}>
                {t(`exercises.${record.exerciseName}`, { defaultValue: record.exerciseName })}
              </Text>
              <Text style={{ color: colors.text }}>
                {t('progress.maxWeight')}: {fromCanonicalKg(record.maxWeightKg, unit)} {unit}
              </Text>
              <Text style={{ color: colors.text }}>
                {t('progress.maxVolume')}: {fromCanonicalKg(record.maxSetVolumeKg, unit)} {unit}
              </Text>
              {record.trend.map((point) => (
                <Text key={point.date} style={{ color: colors.textMuted }}>
                  {point.date}: {fromCanonicalKg(point.maxWeightKg, unit)} {unit} ·{' '}
                  {fromCanonicalKg(point.volumeKg, unit)} {unit}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyState title={t('progress.emptyTitle')} body={t('progress.emptyBody')} />
      )}
    </Screen>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ color: colors.textMuted }}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, paddingBottom: 90 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  value: { fontSize: 22, fontWeight: '900' },
  heading: { fontSize: 20, fontWeight: '900', marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 5 },
  name: { fontSize: 17, fontWeight: '800' },
});
