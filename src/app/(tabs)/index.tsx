import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { workoutRepository } from '@/database/repositories/workout-repository';
import { fromCanonicalKg } from '@/domain/units/weight';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { AppHeader } from '@/shared/ui/app-header';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';

export default function HomeScreen() {
  const { t } = useTranslation(); const { colors } = useAppTheme(); const unit = usePreferencesStore((s) => s.weightUnit);
  const [summary, setSummary] = useState({ count: 0, volume: 0, active: false });
  useFocusEffect(useCallback(() => { void Promise.all([workoutRepository.listCompleted(), workoutRepository.getActive()]).then(([items, active]) => { const since = Date.now() - 7 * 86400000; setSummary({ count: items.length, volume: items.filter((item) => new Date(item.completedAt).getTime() >= since).reduce((sum, item) => sum + item.volumeKg, 0), active: Boolean(active) }); }); }, []));
  return <Screen bottomInset="tabBar"><AppHeader title={t('home.title')} actionLabel={t('settings.title')} onAction={() => router.push('/settings')} /><View style={styles.content}><Text style={[styles.greeting, { color: colors.text }]}>{t('home.greeting')}</Text>{summary.active ? <Button label={t('home.resumeDraft')} onPress={() => router.push('/workout')} /> : <Button label={t('start.title')} onPress={() => router.push('/(tabs)/start')} />}<View style={styles.row}><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={{ color: colors.textMuted }}>{t('home.workouts')}</Text><Text style={[styles.value, { color: colors.text }]}>{summary.count}</Text></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={{ color: colors.textMuted }}>{t('home.weeklyVolume')}</Text><Text style={[styles.value, { color: colors.text }]}>{fromCanonicalKg(summary.volume, unit)} {unit}</Text></View></View>{summary.count === 0 ? <Text style={{ color: colors.textMuted }}>{t('home.noWorkouts')}</Text> : null}</View></Screen>;
}
const styles = StyleSheet.create({ content: { padding: 20, gap: 18 }, greeting: { fontSize: 24, fontWeight: '800' }, row: { flexDirection: 'row', gap: 12 }, card: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 16, gap: 5 }, value: { fontSize: 22, fontWeight: '900' } });
