import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ProgramSummary } from '@/domain/programs/types';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';

export function ProgramCard({ program, onOpen, onDuplicate, onDelete, onMoveUp, onMoveDown, first, last }: {
  program: ProgramSummary; onOpen: () => void; onDuplicate: () => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void; first: boolean; last: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.main}>
        <Text style={[styles.name, { color: colors.text }]}>{program.name}</Text>
        {program.description ? <Text numberOfLines={2} style={{ color: colors.textMuted }}>{program.description}</Text> : null}
        <Text style={{ color: colors.textMuted }}>{program.exerciseCount} {t('programs.exerciseCount')} · {program.setCount} {t('programs.sets')}</Text>
      </Pressable>
      <View style={styles.row}>
        <Button variant="ghost" label={t('common.moveUp')} onPress={onMoveUp} disabled={first} />
        <Button variant="ghost" label={t('common.moveDown')} onPress={onMoveDown} disabled={last} />
      </View>
      <View style={styles.row}>
        <Button variant="secondary" label={t('common.duplicate')} onPress={onDuplicate} />
        <Button variant="ghost" label={t('common.delete')} onPress={onDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' }, main: { padding: 18, gap: 7 },
  name: { fontSize: 20, fontWeight: '800' }, row: { flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingBottom: 10 },
});
