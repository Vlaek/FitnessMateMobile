import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { exerciseDisplayName } from '@/domain/exercises/display-name';
import { fromCanonicalKg, toCanonicalKg } from '@/domain/units/weight';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { LoadingScreen } from '@/shared/ui/loading-screen';
import { Screen } from '@/shared/ui/screen';
import { TextField } from '@/shared/ui/text-field';

import { ExercisePicker } from './exercise-picker';
import { addExercise, addSet, moveExercise, removeExercise, removeSet, updateSet } from './program-editor-state';
import { useProgramEditor } from './use-program-editor';

export function ProgramEditorScreen({ programId }: { programId?: string }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((state) => state.weightUnit);
  const editor = useProgramEditor(programId);
  const [picker, setPicker] = useState(false);
  if (editor.loading) return <LoadingScreen />;
  if (editor.error === 'not-found') return <ErrorScreen message={t('programs.notFound')} onRetry={() => router.back()} />;
  const save = async () => { const result = await editor.save(); if (result) router.back(); };
  return <Screen scroll keyboardAware>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: colors.primary }}>{t('common.cancel')}</Text></Pressable><Text style={[styles.title, { color: colors.text }]}>{programId ? t('common.edit') : t('programs.new')}</Text></View>
    <TextField label={t('programs.name')} value={editor.draft.name} onChangeText={(name) => editor.setDraft({ ...editor.draft, name })} />
    <TextField label={t('programs.description')} value={editor.draft.description} multiline onChangeText={(description) => editor.setDraft({ ...editor.draft, description })} />
    {editor.draft.exercises.map((exercise, exerciseIndex) => {
      const info = editor.exercises.find((item) => item.id === exercise.exerciseId);
      return <View key={`${exercise.exerciseId}-${exerciseIndex}`} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.exercise, { color: colors.text }]}>{info ? exerciseDisplayName(info, t) : exercise.exerciseId}</Text>
        <View style={styles.row}><Button label="↑" variant="secondary" disabled={exerciseIndex === 0} onPress={() => editor.setDraft(moveExercise(editor.draft, exerciseIndex, exerciseIndex - 1))} /><Button label="↓" variant="secondary" disabled={exerciseIndex === editor.draft.exercises.length - 1} onPress={() => editor.setDraft(moveExercise(editor.draft, exerciseIndex, exerciseIndex + 1))} /><Button label={t('common.delete')} variant="ghost" onPress={() => editor.setDraft(removeExercise(editor.draft, exerciseIndex))} /></View>
        {exercise.sets.map((set, setIndex) => <View key={setIndex} style={styles.setRow}>
          <Text style={{ color: colors.text }}>{setIndex + 1}</Text>
          <TextField label={`${t('editor.weight')} (${unit})`} keyboardType="decimal-pad" value={String(fromCanonicalKg(set.weightKg, unit))} onChangeText={(value) => editor.setDraft(updateSet(editor.draft, exerciseIndex, setIndex, { ...set, weightKg: toCanonicalKg(Math.max(0, Number(value.replace(',', '.')) || 0), unit) }))} />
          <TextField label={t('editor.reps')} keyboardType="number-pad" value={String(set.repetitions)} onChangeText={(value) => editor.setDraft(updateSet(editor.draft, exerciseIndex, setIndex, { ...set, repetitions: Math.max(1, Number.parseInt(value, 10) || 1) }))} />
          <Button label="−" variant="ghost" disabled={exercise.sets.length === 1} onPress={() => editor.setDraft(removeSet(editor.draft, exerciseIndex, setIndex))} />
        </View>)}
        <Button label={t('editor.addSet')} variant="secondary" onPress={() => editor.setDraft(addSet(editor.draft, exerciseIndex))} />
      </View>;
    })}
    <Button label={t('editor.addExercise')} variant="secondary" onPress={() => setPicker(true)} />
    {editor.error ? <Text style={{ color: colors.danger }}>{editor.error}</Text> : null}
    <Button label={t('common.save')} loading={editor.saving} disabled={!editor.draft.name.trim() || editor.draft.exercises.length === 0} onPress={() => void save()} />
    <ExercisePicker visible={picker} exercises={editor.exercises} onClose={() => setPicker(false)} onCreate={editor.createExercise} onChoose={(item) => { editor.setDraft(addExercise(editor.draft, item.id)); setPicker(false); }} />
  </Screen>;
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', gap: 18 }, title: { fontSize: 24, fontWeight: '900' }, card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 }, exercise: { fontSize: 18, fontWeight: '800' }, row: { flexDirection: 'row', gap: 8 }, setRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, });
