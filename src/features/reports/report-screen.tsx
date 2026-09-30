import { workoutRepository } from '@/database/repositories/workout-repository';
import type { TWorkout } from '@/domain/workouts/types';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { LoadingScreen } from '@/shared/ui/loading-screen';
import { Screen } from '@/shared/ui/screen';
import { TextField } from '@/shared/ui/text-field';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { reportDraftStore, useReportDraftStore } from './report-draft-store';
import {
  generateWorkoutReport,
  isTelegramMessageTooLong,
  TELEGRAM_MESSAGE_LIMIT,
  type TReportSortMode,
} from './report-generator';
import { telegramCredentials } from './telegram-credentials';
import { sendTelegramMessage } from './telegram-service';

export function ReportScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const workoutIds = useReportDraftStore((state) => state.workoutIds);
  const weightUnit = usePreferencesStore((state) => state.weightUnit);
  const [workouts, setWorkouts] = useState<TWorkout[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortMode, setSortMode] = useState<TReportSortMode>('selection');
  const [loading, setLoading] = useState(workoutIds.length > 0);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (workoutIds.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    void workoutRepository
      .getCompletedByIds(workoutIds)
      .then((loaded) => {
        if (!cancelled) {
          setWorkouts(loaded);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t, workoutIds]);

  const reportText = useMemo(
    () =>
      generateWorkoutReport({
        workouts,
        selectionOrder: workoutIds,
        sortMode,
        title,
        description,
        weightUnit,
        locale: i18n.language,
        labels: {
          totalOutput: t('reports.totalOutput'),
          noCompletedSets: t('reports.noCompletedSets'),
          unit: t(`common.${weightUnit}`),
          exerciseName: (key) => t(`exercises.${key}`, { defaultValue: key }),
        },
      }),
    [description, i18n.language, sortMode, t, title, weightUnit, workoutIds, workouts],
  );
  const tooLong = isTelegramMessageTooLong(reportText);

  const goBack = () => {
    reportDraftStore.getState().clear();
    router.back();
  };

  const share = async () => {
    try {
      await Share.share({
        title: title.trim() || t('reports.defaultTitle'),
        message: reportText,
      });
    } catch {
      Alert.alert(t('reports.shareFailed'));
    }
  };

  const send = async () => {
    if (sending || tooLong) {
      return;
    }

    setSending(true);

    try {
      const credentials = await telegramCredentials.load();

      if (!credentials.token.trim() || !credentials.chatId.trim()) {
        Alert.alert(t('reports.telegramNotConfigured'), t('reports.configureTelegram'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('reports.openSettings'),
            onPress: () => router.push('/settings'),
          },
        ]);

        return;
      }

      const result = await sendTelegramMessage(credentials, reportText);

      if (result.ok) {
        Alert.alert(t('reports.sent'));
      } else {
        Alert.alert(
          result.reason === 'network'
            ? t('reports.networkError')
            : result.reason === 'invalid-response'
              ? t('reports.invalidResponse')
              : result.message || t('reports.sendFailed'),
        );
      }
    } catch {
      Alert.alert(t('reports.credentialsError'));
    } finally {
      setSending(false);
    }
  };

  if (workoutIds.length === 0) {
    return (
      <ErrorScreen
        message={t('reports.noSelection')}
        actionLabel={t('common.goBack')}
        onRetry={goBack}
      />
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return <ErrorScreen message={loadError} actionLabel={t('common.goBack')} onRetry={goBack} />;
  }

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{t('reports.create')}</Text>

      <TextField label={t('reports.title')} value={title} onChangeText={setTitle} />

      <TextField
        label={t('reports.description')}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={styles.description}
      />

      <View style={styles.group}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('reports.sorting')}</Text>
        <View style={styles.sortActions}>
          <View style={styles.sortAction}>
            <Button
              label={t('reports.selectionOrder')}
              variant={sortMode === 'selection' ? 'primary' : 'secondary'}
              onPress={() => setSortMode('selection')}
            />
          </View>

          <View style={styles.sortAction}>
            <Button
              label={t('reports.byDate')}
              variant={sortMode === 'date' ? 'primary' : 'secondary'}
              onPress={() => setSortMode('date')}
            />
          </View>
        </View>
      </View>
      <View style={styles.group}>
        <View style={styles.previewHeading}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('reports.preview')}</Text>
          <Text style={{ color: tooLong ? colors.danger : colors.textMuted }}>
            {reportText.length} / {TELEGRAM_MESSAGE_LIMIT}
          </Text>
        </View>
        {tooLong ? <Text style={{ color: colors.danger }}>{t('reports.tooLong')}</Text> : null}
        <View
          style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text testID="report-preview" selectable style={{ color: colors.text }}>
            {reportText}
          </Text>
        </View>
      </View>
      <Button
        label={t('reports.sendToTelegram')}
        loading={sending}
        disabled={tooLong}
        onPress={() => void send()}
      />
      <Button label={t('reports.share')} variant="secondary" onPress={() => void share()} />
      <Button label={t('common.goBack')} variant="ghost" onPress={goBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  title: { fontSize: 28, fontWeight: '900' },
  description: { minHeight: 112, paddingTop: 14 },
  group: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sortActions: { flexDirection: 'row', gap: 10 },
  sortAction: { flex: 1 },
  previewHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preview: { borderWidth: 1, borderRadius: 14, padding: 14 },
});
