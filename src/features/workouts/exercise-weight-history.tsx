import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { workoutRepository } from '@/database/repositories/workout-repository';
import type { TExerciseWeightHistory, TWorkoutExercise } from '@/domain/workouts/types';
import { fromCanonicalKg, getWeightUnitTranslationKey } from '@/domain/units/weight';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';

export function ExerciseWeightHistory({ exercise }: { exercise: TWorkoutExercise }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((state) => state.weightUnit);
  const [history, setHistory] = useState<TExerciseWeightHistory[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { sourceExerciseId, exerciseName, muscleGroup } = exercise;

  useEffect(() => {
    let active = true;
    void workoutRepository
      .getExerciseWeightHistory({ sourceExerciseId, exerciseName, muscleGroup })
      .then((rows) => {
        if (active) {
          setHistory(rows);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [sourceExerciseId, exerciseName, muscleGroup, attempt]);

  if (failed) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)}>
        <Text style={{ color: colors.textMuted }}>{t('workout.weightHistoryRetry')}</Text>
      </Pressable>
    );
  }

  if (!history.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.weights}>
        {history.map((item) => (
          <View
            key={item.weightKg}
            style={[
              styles.weight,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.value, { color: colors.text }]}>
              {fromCanonicalKg(item.weightKg, unit)} {t(getWeightUnitTranslationKey(unit))}
            </Text>
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {t('workout.historyMaxReps', { count: item.maxRepetitions })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  weights: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weight: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  value: { fontSize: 13, fontWeight: '700' },
  count: { fontSize: 11 },
});
