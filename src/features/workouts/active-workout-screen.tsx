import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { exerciseDisplayName } from '@/domain/exercises/display-name';
import { fromCanonicalKg, toCanonicalKg } from '@/domain/units/weight';
import { exerciseRepository } from '@/database/repositories/exercise-repository';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadingScreen } from '@/shared/ui/loading-screen';
import { Screen } from '@/shared/ui/screen';
import { TextField } from '@/shared/ui/text-field';

import { ExercisePicker } from '../programs/editor/exercise-picker';
import { useActiveWorkout } from './use-active-workout';

export function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((s) => s.weightUnit);
  const state = useActiveWorkout();
  const [picker, setPicker] = useState(false);

  if (state.loading) {
    return <LoadingScreen />;
  }

  if (!state.workout) {
    return (
      <Screen>
        <EmptyState
          title={t('workout.noActive')}
          body={t('start.choose')}
          actionLabel={t('start.title')}
          onAction={() => router.replace('/(tabs)/start')}
        />
      </Screen>
    );
  }

  const workout = state.workout;
  const setExercise = (
    index: number,
    transform: (value: (typeof workout.exercises)[number]) => (typeof workout.exercises)[number],
  ) =>
    state.setWorkout({
      ...workout,
      exercises: workout.exercises.map((item, itemIndex) =>
        itemIndex === index ? transform(item) : item,
      ),
    });
  const finish = () =>
    Alert.alert(t('workout.finishTitle'), t('workout.finishBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workout.finish'),
        onPress: () =>
          void workoutRepository
            .save(workout)
            .then(() => workoutRepository.complete(workout.id))
            .then(() => router.replace('/(tabs)/history')),
      },
    ]);
  const discard = () =>
    Alert.alert(t('workout.discardTitle'), t('workout.discardBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workout.discard'),
        style: 'destructive',
        onPress: () =>
          void workoutRepository.delete(workout.id).then(() => router.replace('/(tabs)/start')),
      },
    ]);

  return (
    <Screen scroll keyboardAware>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{workout.name}</Text>
        <Pressable onPress={discard}>
          <Text style={{ color: colors.danger }}>{t('workout.discard')}</Text>
        </Pressable>
      </View>
      <Text style={{ color: colors.textMuted }}>
        {new Date(workout.startedAt).toLocaleString()}
      </Text>
      {workout.exercises.map((exercise, exerciseIndex) => (
        <View
          key={exercise.id}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.header}>
            <Text style={[styles.exercise, { color: colors.text }]}>
              {t(`exercises.${exercise.exerciseName}`, { defaultValue: exercise.exerciseName })}
            </Text>
            <Button
              label={t('common.delete')}
              variant="ghost"
              onPress={() =>
                state.setWorkout({
                  ...workout,
                  exercises: workout.exercises.filter((_, i) => i !== exerciseIndex),
                })
              }
            />
          </View>
          {exercise.sets.map((set, setIndex) => (
            <View key={set.id} style={styles.setRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: set.isCompleted }}
                onPress={() =>
                  setExercise(exerciseIndex, (value) => ({
                    ...value,
                    sets: value.sets.map((item, i) =>
                      i === setIndex ? { ...item, isCompleted: !item.isCompleted } : item,
                    ),
                  }))
                }
                style={[
                  styles.check,
                  {
                    borderColor: set.isCompleted ? colors.success : colors.border,
                    backgroundColor: set.isCompleted ? colors.success : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: '#fff' }}>{set.isCompleted ? '✓' : ''}</Text>
              </Pressable>
              <TextField
                label={`${t('editor.weight')} (${unit})`}
                value={String(fromCanonicalKg(set.weightKg, unit))}
                keyboardType="decimal-pad"
                onChangeText={(text) =>
                  setExercise(exerciseIndex, (value) => ({
                    ...value,
                    sets: value.sets.map((item, i) =>
                      i === setIndex
                        ? {
                            ...item,
                            weightKg: toCanonicalKg(
                              Math.max(0, Number(text.replace(',', '.')) || 0),
                              unit,
                            ),
                          }
                        : item,
                    ),
                  }))
                }
              />
              <TextField
                label={t('editor.reps')}
                value={String(set.repetitions)}
                keyboardType="number-pad"
                onChangeText={(text) =>
                  setExercise(exerciseIndex, (value) => ({
                    ...value,
                    sets: value.sets.map((item, i) =>
                      i === setIndex
                        ? { ...item, repetitions: Math.max(1, Number.parseInt(text, 10) || 1) }
                        : item,
                    ),
                  }))
                }
              />
              <Button
                label="−"
                variant="ghost"
                disabled={exercise.sets.length === 1}
                onPress={() =>
                  setExercise(exerciseIndex, (value) => ({
                    ...value,
                    sets: value.sets.filter((_, i) => i !== setIndex),
                  }))
                }
              />
            </View>
          ))}
          <Button
            label={t('editor.addSet')}
            variant="secondary"
            onPress={() =>
              setExercise(exerciseIndex, (value) => ({
                ...value,
                sets: [
                  ...value.sets,
                  {
                    ...(value.sets.at(-1) ?? { weightKg: 0, repetitions: 10, isCompleted: false }),
                    id: randomUUID(),
                    isCompleted: false,
                  },
                ],
              }))
            }
          />
        </View>
      ))}
      <Button label={t('editor.addExercise')} variant="secondary" onPress={() => setPicker(true)} />
      {state.error ? <Text style={{ color: colors.danger }}>{state.error}</Text> : null}
      <Button
        label={t('workout.finish')}
        disabled={
          !workout.exercises.some((exercise) => exercise.sets.some((set) => set.isCompleted))
        }
        onPress={finish}
      />
      <ExercisePicker
        visible={picker}
        exercises={state.exercises}
        onClose={() => setPicker(false)}
        onCreate={(name, muscleGroup) => exerciseRepository.createCustom({ name, muscleGroup })}
        onChoose={(exercise) => {
          state.addExercise(exercise, exerciseDisplayName(exercise, t));
          setPicker(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  title: { fontSize: 26, fontWeight: '900', flex: 1 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  exercise: { fontSize: 18, fontWeight: '800', flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  check: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
