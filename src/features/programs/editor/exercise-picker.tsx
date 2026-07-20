import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { exerciseDisplayName } from '@/domain/exercises/display-name';
import type { Exercise, MuscleGroup } from '@/domain/exercises/types';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';
import { TextField } from '@/shared/ui/text-field';

const groups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'other'];

export function ExercisePicker({ visible, exercises, onClose, onChoose, onCreate }: {
  visible: boolean; exercises: Exercise[]; onClose: () => void; onChoose: (exercise: Exercise) => void;
  onCreate: (name: string, muscleGroup: MuscleGroup) => Promise<Exercise>;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [group, setGroup] = useState<MuscleGroup>('other');
  const filtered = useMemo(() => exercises.filter((item) => exerciseDisplayName(item, t).toLocaleLowerCase().includes(search.toLocaleLowerCase())), [exercises, search, t]);
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <Screen scroll keyboardAware>
      <Text style={[styles.title, { color: colors.text }]}>{t('editor.chooseExercise')}</Text>
      <TextField label={t('editor.searchExercise')} value={search} onChangeText={setSearch} />
      <ScrollView style={styles.list} nestedScrollEnabled>
        {filtered.map((item) => <Pressable key={item.id} style={[styles.item, { borderColor: colors.border }]} onPress={() => onChoose(item)}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{exerciseDisplayName(item, t)}</Text>
          <Text style={{ color: colors.textMuted }}>{t(`muscleGroups.${item.muscleGroup}`)}</Text>
        </Pressable>)}
      </ScrollView>
      <Text style={[styles.subtitle, { color: colors.text }]}>{t('editor.customExercise')}</Text>
      <TextField label={t('editor.customName')} value={customName} onChangeText={setCustomName} />
      <View style={styles.groups}>{groups.map((value) => <Pressable key={value} onPress={() => setGroup(value)} style={[styles.chip, { borderColor: group === value ? colors.primary : colors.border, backgroundColor: colors.surface }]}><Text style={{ color: colors.text }}>{t(`muscleGroups.${value}`)}</Text></Pressable>)}</View>
      <Button label={t('common.create')} disabled={!customName.trim()} onPress={() => void onCreate(customName, group).then((item) => { setCustomName(''); onChoose(item); })} />
      <Button label={t('common.close')} variant="secondary" onPress={onClose} />
    </Screen>
  </Modal>;
}

const styles = StyleSheet.create({ title: { fontSize: 26, fontWeight: '900' }, subtitle: { fontSize: 18, fontWeight: '800', marginTop: 8 }, list: { maxHeight: 280 }, item: { paddingVertical: 12, borderBottomWidth: 1, gap: 3 }, groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1 } });
