import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { workoutRepository } from '@/database/repositories/workout-repository';
import { fromCanonicalKg, toCanonicalKg } from '@/domain/units/weight';
import type { Workout } from '@/domain/workouts/types';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { LoadingScreen } from '@/shared/ui/loading-screen';
import { NumericField } from '@/shared/ui/numeric-field';
import { Screen } from '@/shared/ui/screen';

export function WorkoutDetailScreen({ workoutId }: { workoutId: string }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((state) => state.weightUnit);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [draft, setDraft] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void workoutRepository
      .getById(workoutId)
      .then(setWorkout)
      .finally(() => setLoading(false));
  }, [workoutId]);

  if (loading) return <LoadingScreen />;
  if (!workout) {
    return (
      <ErrorScreen
        message={t('history.emptyTitle')}
        actionLabel={t('common.goBack')}
        onRetry={() => router.back()}
      />
    );
  }

  const editedWorkout = draft ?? workout;
  const isEditing = draft !== null;

  const setExercise = (
    index: number,
    transform: (value: Workout['exercises'][number]) => Workout['exercises'][number],
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      exercises: draft.exercises.map((item, itemIndex) =>
        itemIndex === index ? transform(item) : item
      ),
    });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await workoutRepository.save(draft);
      setWorkout(draft);
      setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const share = () => {
    const body = [
      workout.name,
      new Date(workout.completedAt ?? workout.startedAt).toLocaleString(),
      ...workout.exercises.map((exercise) =>
        `${t(`exercises.${exercise.exerciseName}`, { defaultValue: exercise.exerciseName })}: ${
          exercise.sets
            .filter((set) => set.isCompleted)
            .map((set) =>
              `${fromCanonicalKg(set.weightKg, unit)} ${unit} × ${set.repetitions}`
            )
            .join(', ')
        }`
      ),
    ].join('\n');
    void Share.share({ title: workout.name, message: body });
  };

  const remove = () =>
    Alert.alert(t('history.deleteTitle'), t('history.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => void workoutRepository.delete(workout.id).then(() => router.back()),
      },
    ]);

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.text }]}>{workout.name}</Text>
        <Text style={{ color: colors.textMuted }}>
          {new Date(workout.completedAt ?? workout.startedAt).toLocaleString()}
        </Text>
      </View>

      <View style={styles.exerciseList}>
        {editedWorkout.exercises.map((exercise, exerciseIndex) => (
          <View
            key={exercise.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.exercise, { color: colors.text }]}>
              {t(`exercises.${exercise.exerciseName}`, {
                defaultValue: exercise.exerciseName,
              })}
            </Text>
            <View style={styles.setList}>
              {exercise.sets.map((set, setIndex) => (
                <View key={set.id} style={isEditing ? styles.editRow : styles.valueRow}>
                  <Text style={[styles.setNumber, { color: colors.textMuted }]}>
                    {t('editor.setNumber', { number: setIndex + 1 })}
                  </Text>
                  {isEditing ? (
                    <>
                      <View style={styles.field}>
                        <NumericField
                          label={`${t('editor.weight')} (${unit})`}
                          value={fromCanonicalKg(set.weightKg, unit)}
                          onValueChange={(value) =>
                            setExercise(exerciseIndex, (current) => ({
                              ...current,
                              sets: current.sets.map((item, itemIndex) =>
                                itemIndex === setIndex
                                  ? { ...item, weightKg: toCanonicalKg(value, unit) }
                                  : item
                              ),
                            }))
                          }
                        />
                      </View>
                      <View style={styles.field}>
                        <NumericField
                          integer
                          label={t('editor.reps')}
                          value={set.repetitions}
                          onValueChange={(value) =>
                            setExercise(exerciseIndex, (current) => ({
                              ...current,
                              sets: current.sets.map((item, itemIndex) =>
                                itemIndex === setIndex
                                  ? { ...item, repetitions: value }
                                  : item
                              ),
                            }))
                          }
                        />
                      </View>
                    </>
                  ) : (
                    <Text selectable style={[styles.value, { color: colors.text }]}>
                      {fromCanonicalKg(set.weightKg, unit)} {unit} × {set.repetitions}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {isEditing ? (
        <Button label={t('common.save')} loading={saving} onPress={() => void save()} />
      ) : (
        <Button label={t('common.edit')} onPress={() => setDraft(cloneWorkout(workout))} />
      )}
      <View style={styles.secondaryActions}>
        <Button label={t('history.share')} variant="secondary" onPress={share} />
        <Button label={t('common.delete')} variant="danger" onPress={remove} />
      </View>
      <Button label={t('common.goBack')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function cloneWorkout(workout: Workout): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set })),
    })),
  };
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  heading: { gap: 6 },
  title: { fontSize: 26, fontWeight: '900' },
  exerciseList: { gap: 16 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 14 },
  exercise: { fontSize: 18, fontWeight: '800' },
  setList: { gap: 12 },
  valueRow: { gap: 6, paddingVertical: 4 },
  editRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 },
  setNumber: { width: '100%', fontWeight: '700' },
  value: { fontSize: 16, fontVariant: ['tabular-nums'] },
  field: { flex: 1, minWidth: 120 },
  secondaryActions: { gap: 12 },
});
