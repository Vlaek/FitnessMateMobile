import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Workout } from '@/domain/workouts/types';
import { fromCanonicalKg, toCanonicalKg } from '@/domain/units/weight';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { LoadingScreen } from '@/shared/ui/loading-screen';
import { Screen } from '@/shared/ui/screen';
import { TextField } from '@/shared/ui/text-field';

export function WorkoutDetailScreen({ workoutId }: { workoutId: string }) {
  const { t } = useTranslation(); const { colors } = useAppTheme(); const unit = usePreferencesStore((s) => s.weightUnit);
  const [workout, setWorkout] = useState<Workout | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { void workoutRepository.getById(workoutId).then(setWorkout).finally(() => setLoading(false)); }, [workoutId]);
  if (loading) return <LoadingScreen />; if (!workout) return <ErrorScreen message={t('history.emptyTitle')} actionLabel={t('common.close')} onRetry={() => router.back()} />;
  const setExercise = (index: number, transform: (value: Workout['exercises'][number]) => Workout['exercises'][number]) => setWorkout({ ...workout, exercises: workout.exercises.map((item, i) => i === index ? transform(item) : item) });
  const save = async () => { setSaving(true); await workoutRepository.save(workout); setSaving(false); router.back(); };
  const share = () => { const body = [workout.name, new Date(workout.completedAt ?? workout.startedAt).toLocaleString(), ...workout.exercises.map((exercise) => `${t(`exercises.${exercise.exerciseName}`, { defaultValue: exercise.exerciseName })}: ${exercise.sets.filter((set) => set.isCompleted).map((set) => `${fromCanonicalKg(set.weightKg, unit)} ${unit} × ${set.repetitions}`).join(', ')}`)].join('\n'); void Share.share({ title: workout.name, message: body }); };
  const remove = () => Alert.alert(t('history.deleteTitle'), t('history.deleteBody'), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => void workoutRepository.delete(workout.id).then(() => router.back()) }]);
  return <Screen scroll keyboardAware>
    <Text style={[styles.title, { color: colors.text }]}>{workout.name}</Text><Text style={{ color: colors.textMuted }}>{new Date(workout.completedAt ?? workout.startedAt).toLocaleString()}</Text>
    {workout.exercises.map((exercise, exerciseIndex) => <View key={exercise.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.exercise, { color: colors.text }]}>{t(`exercises.${exercise.exerciseName}`, { defaultValue: exercise.exerciseName })}</Text>{exercise.sets.map((set, setIndex) => <View key={set.id} style={styles.row}><TextField label={`${t('editor.weight')} (${unit})`} value={String(fromCanonicalKg(set.weightKg, unit))} keyboardType="decimal-pad" onChangeText={(text) => setExercise(exerciseIndex, (value) => ({ ...value, sets: value.sets.map((item, i) => i === setIndex ? { ...item, weightKg: toCanonicalKg(Math.max(0, Number(text.replace(',', '.')) || 0), unit) } : item) }))} /><TextField label={t('editor.reps')} value={String(set.repetitions)} keyboardType="number-pad" onChangeText={(text) => setExercise(exerciseIndex, (value) => ({ ...value, sets: value.sets.map((item, i) => i === setIndex ? { ...item, repetitions: Math.max(1, Number.parseInt(text, 10) || 1) } : item) }))} /></View>)}</View>)}
    <Button label={t('common.save')} loading={saving} onPress={() => void save()} /><Button label={t('history.share')} variant="secondary" onPress={share} /><Button label={t('common.delete')} variant="danger" onPress={remove} /><Button label={t('common.close')} variant="ghost" onPress={() => router.back()} />
  </Screen>;
}
const styles = StyleSheet.create({ title: { fontSize: 26, fontWeight: '900' }, card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 }, exercise: { fontSize: 18, fontWeight: '800' }, row: { flexDirection: 'row', gap: 10 } });
