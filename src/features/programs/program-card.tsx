import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GestureDetector } from 'react-native-gesture-handler';
import type { TProgramSummary } from '@/domain/programs/types';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import type { TSortableDragGesture } from '@/shared/ui/sortable-list';

export function ProgramCard({
  program,
  onOpen,
  onDelete,
  dragGesture,
}: {
  program: TProgramSummary;
  onOpen: () => void;
  onDelete: () => void;
  dragGesture?: TSortableDragGesture;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const content = (
    <View style={styles.main}>
      <Text style={[styles.name, { color: colors.text }]}>{program.name}</Text>
      {program.description ? (
        <Text numberOfLines={2} style={{ color: colors.textMuted }}>
          {program.description}
        </Text>
      ) : null}
      <Text style={{ color: colors.textMuted }}>
        {program.exerciseCount} {t('programs.exerciseCount')} · {program.setCount}{' '}
        {t('programs.sets')}
      </Text>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityLabel={t('programs.remove')}
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDelete}
        style={styles.remove}
      >
        <Text style={[styles.removeLabel, { color: colors.textMuted }]}>×</Text>
      </Pressable>
      {dragGesture ? <GestureDetector gesture={dragGesture}>{content}</GestureDetector> : content}
      <Button style={styles.edit} variant="secondary" label={t('common.edit')} onPress={onOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden', paddingBottom: 12 },
  main: { padding: 18, paddingRight: 52, gap: 7 },
  name: { fontSize: 20, fontWeight: '800' },
  remove: {
    position: 'absolute',
    right: 10,
    top: 8,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: { fontSize: 28, lineHeight: 30 },
  edit: { marginHorizontal: 12 },
});
