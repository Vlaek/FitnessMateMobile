import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ProgramSummary } from '@/domain/programs/types';
import { programRepository } from '@/database/repositories/program-repository';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { AppHeader } from '@/shared/ui/app-header';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';

export default function StartScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [hasActive, setHasActive] = useState(false);
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      void Promise.all([programRepository.list(), workoutRepository.getActive()]).then(
        ([items, active]) => {
          setPrograms(items);
          setHasActive(Boolean(active));
        },
      );
    }, []),
  );
  const begin = async (programId?: string) => {
    setBusy(true);

    try {
      if (programId) {
        await workoutRepository.startFromProgram(programId);
      } else {
        await workoutRepository.startEmpty(t('workout.defaultName'));
      }

      router.push('/workout');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen bottomInset="tabBar">
      <AppHeader title={t('start.title')} />
      <View style={styles.content}>
        <Text style={[styles.lead, { color: colors.text }]}>{t('start.choose')}</Text>
        {hasActive ? (
          <Button label={t('home.resumeDraft')} onPress={() => router.push('/workout')} />
        ) : (
          <Button
            label={t('start.emptyWorkout')}
            variant="secondary"
            loading={busy}
            onPress={() => void begin()}
          />
        )}
        {!hasActive ? (
          <FlatList
            data={programs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                  <Text style={{ color: colors.textMuted }}>
                    {item.exerciseCount} {t('programs.exerciseCount')}
                  </Text>
                </View>
                <Button
                  label={t('nav.start')}
                  disabled={busy}
                  onPress={() => void begin(item.id)}
                />
              </View>
            )}
            ListEmptyComponent={
              <Button
                label={t('programs.new')}
                variant="secondary"
                onPress={() => router.push('/programs/new')}
              />
            }
          />
        ) : null}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, flex: 1 },
  lead: { fontSize: 18 },
  list: { gap: 12, paddingBottom: 90 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: { fontSize: 17, fontWeight: '800' },
});
