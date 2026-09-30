import { exerciseDisplayName } from '@/domain/exercises/display-name';
import {
  fromCanonicalKg,
  getWeightUnitTranslationKey,
  toCanonicalKg,
} from '@/domain/units/weight';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { LoadingScreen } from '@/shared/ui/loading-screen';
import { NumericField } from '@/shared/ui/numeric-field';
import { Screen } from '@/shared/ui/screen';
import { SortableList } from '@/shared/ui/sortable-list';
import { TextField } from '@/shared/ui/text-field';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { ExercisePicker } from './exercise-picker';
import {
  addExercise,
  addSet,
  moveExercise,
  removeExercise,
  removeSet,
  updateSet,
} from './program-editor-state';
import { useProgramEditor } from './use-program-editor';

export function ProgramEditorScreen({ programId }: { programId?: string }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const unit = usePreferencesStore((state) => state.weightUnit);
  const editor = useProgramEditor(programId);
  const [picker, setPicker] = useState(false);

  if (editor.loading) {
    return <LoadingScreen />;
  }

  if (editor.error === 'not-found') {
    return (
      <ErrorScreen
        message={t('programs.notFound')}
        actionLabel={t('common.goBack')}
        onRetry={() => router.back()}
      />
    );
  }

  const save = async () => {
    const result = await editor.save();

    if (result) {
      router.back();
    }
  };

  const sortableExercises = editor.draft.exercises.map((exercise, index) => ({
    exercise,
    key: `${exercise.exerciseId}-${index}`,
  }));

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {programId ? t('common.edit') : t('programs.new')}
        </Text>
      </View>

      <View style={styles.metadata}>
        <TextField
          label={t('programs.name')}
          value={editor.draft.name}
          onChangeText={(name) => editor.setDraft({ ...editor.draft, name })}
        />
        <TextField
          label={t('programs.description')}
          value={editor.draft.description}
          multiline
          onChangeText={(description) => editor.setDraft({ ...editor.draft, description })}
        />
      </View>

      <SortableList
        accessibilityHint={t('editor.reorderHint')}
        data={sortableExercises}
        keyExtractor={(item) => item.key}
        onReorder={(from, to) => editor.setDraft(moveExercise(editor.draft, from, to))}
        renderItem={({ exercise }, exerciseIndex, dragGesture) => {
          const info = editor.exercises.find((item) => item.id === exercise.exerciseId);

          return (
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.exerciseHeader}>
                <GestureDetector gesture={dragGesture}>
                  <View style={styles.exerciseDragArea}>
                    <Text style={[styles.exercise, { color: colors.text }]}>
                      {info ? exerciseDisplayName(info, t) : exercise.exerciseId}
                    </Text>
                  </View>
                </GestureDetector>
                <Pressable
                  accessibilityLabel={t('editor.removeExercise')}
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => editor.setDraft(removeExercise(editor.draft, exerciseIndex))}
                  style={styles.removeExercise}
                >
                  <Text style={[styles.removeLabel, { color: colors.textMuted }]}>×</Text>
                </Pressable>
              </View>

              <View style={styles.setList}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={[styles.setNumber, { color: colors.textMuted }]}>
                      {t('editor.setNumber', { number: setIndex + 1 })}
                    </Text>
                    <View style={styles.field}>
                      <NumericField
                        label={`${t('editor.weight')} (${t(getWeightUnitTranslationKey(unit))})`}
                        value={fromCanonicalKg(set.weightKg, unit)}
                        onValueChange={(value) =>
                          editor.setDraft(
                            updateSet(editor.draft, exerciseIndex, setIndex, {
                              ...set,
                              weightKg: toCanonicalKg(value, unit),
                            }),
                          )
                        }
                      />
                    </View>
                    <View style={styles.field}>
                      <NumericField
                        integer
                        label={t('editor.reps')}
                        value={set.repetitions}
                        onValueChange={(value) =>
                          editor.setDraft(
                            updateSet(editor.draft, exerciseIndex, setIndex, {
                              ...set,
                              repetitions: value,
                            }),
                          )
                        }
                      />
                    </View>
                    <Button
                      accessibilityLabel={t('editor.removeSet')}
                      label="−"
                      variant="ghost"
                      disabled={exercise.sets.length === 1}
                      onPress={() =>
                        editor.setDraft(removeSet(editor.draft, exerciseIndex, setIndex))
                      }
                    />
                  </View>
                ))}
              </View>

              <Button
                label={t('editor.addSet')}
                variant="secondary"
                onPress={() => editor.setDraft(addSet(editor.draft, exerciseIndex))}
              />
            </View>
          );
        }}
      />

      <Button
        style={{ marginBottom: 5 }}
        label={t('editor.addExercise')}
        variant="secondary"
        onPress={() => setPicker(true)}
      />

      {editor.error ? (
        <Text selectable style={{ color: colors.danger }}>
          {editor.error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={t('common.save')}
          loading={editor.saving}
          disabled={!editor.draft.name.trim() || editor.draft.exercises.length === 0}
          onPress={() => void save()}
        />
        <Button label={t('common.goBack')} variant="ghost" onPress={() => router.back()} />
      </View>

      <ExercisePicker
        visible={picker}
        exercises={editor.exercises}
        onClose={() => setPicker(false)}
        onCreate={editor.createExercise}
        onChoose={(item) => {
          editor.setDraft(addExercise(editor.draft, item.id));
          setPicker(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  header: { gap: 8 },
  title: { fontSize: 24, fontWeight: '900' },
  metadata: { gap: 16 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 16 },
  exerciseHeader: { minHeight: 40, justifyContent: 'center', paddingRight: 46 },
  exerciseDragArea: { minHeight: 40, justifyContent: 'center' },
  exercise: { fontSize: 18, fontWeight: '800' },
  removeExercise: {
    position: 'absolute',
    right: -4,
    top: -6,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: { fontSize: 28, lineHeight: 30 },
  setList: { gap: 14 },
  setRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8 },
  setNumber: { width: '100%', fontWeight: '700' },
  field: { flex: 1, minWidth: 112 },
  actions: { gap: 12 },
});
