import * as DocumentPicker from 'expo-document-picker';
import { Host, Switch } from '@expo/ui';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  clearAllData,
  exportBackup,
  readBackupFile,
  restoreBackup,
} from '@/features/backup/backup-service';
import { telegramCredentials } from '@/features/reports/telegram-credentials';
import { restTimerService } from '@/features/rest-timer/rest-timer-service';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';
import { TextField } from '@/shared/ui/text-field';
import {
  MAX_REST_TIMER_SECONDS,
  MIN_REST_TIMER_SECONDS,
  usePreferencesStore,
} from './preferences-store';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const unit = usePreferencesStore((s) => s.weightUnit);
  const setUnit = usePreferencesStore((s) => s.setWeightUnit);
  const theme = usePreferencesStore((s) => s.themeMode);
  const setTheme = usePreferencesStore((s) => s.setThemeMode);
  const restTimerEnabled = usePreferencesStore((s) => s.restTimerEnabled);
  const setRestTimerEnabled = usePreferencesStore((s) => s.setRestTimerEnabled);
  const restTimerDurationSeconds = usePreferencesStore((s) => s.restTimerDurationSeconds);
  const setRestTimerDurationSeconds = usePreferencesStore((s) => s.setRestTimerDurationSeconds);
  const reset = usePreferencesStore((s) => s.reset);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [restTimerUpdating, setRestTimerUpdating] = useState(false);

  const updateRestTimerEnabled = async (enabled: boolean) => {
    if (!enabled) {
      setRestTimerEnabled(false);
      await restTimerService.stop();
      return;
    }

    setRestTimerUpdating(true);
    try {
      const granted = await restTimerService.requestPermission();
      if (granted) {
        setRestTimerEnabled(true);
      } else {
        setRestTimerEnabled(false);
        Alert.alert(t('settings.notificationPermissionDenied'));
      }
    } catch {
      setRestTimerEnabled(false);
      Alert.alert(t('settings.notificationPermissionDenied'));
    } finally {
      setRestTimerUpdating(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    void telegramCredentials
      .load()
      .then((credentials) => {
        if (!cancelled) {
          setTelegramToken(credentials.token);
          setTelegramChatId(credentials.chatId);
          setTelegramConfigured(Boolean(credentials.token.trim() && credentials.chatId.trim()));
        }
      })
      .catch(() => {
        if (!cancelled) {
          Alert.alert(t('settings.telegramError'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTelegramLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const saveTelegram = async () => {
    const credentials = {
      token: telegramToken.trim(),
      chatId: telegramChatId.trim(),
    };
    setTelegramSaving(true);

    try {
      await telegramCredentials.save(credentials);
      setTelegramToken(credentials.token);
      setTelegramChatId(credentials.chatId);
      setTelegramConfigured(Boolean(credentials.token && credentials.chatId));
      Alert.alert(t('settings.telegramSaved'));
    } catch {
      Alert.alert(t('settings.telegramError'));
    } finally {
      setTelegramSaving(false);
    }
  };

  const removeTelegram = async () => {
    setTelegramSaving(true);

    try {
      await telegramCredentials.clear();
      setTelegramToken('');
      setTelegramChatId('');
      setTelegramConfigured(false);
      Alert.alert(t('settings.telegramRemoved'));
    } catch {
      Alert.alert(t('settings.telegramError'));
    } finally {
      setTelegramSaving(false);
    }
  };

  const chooseExport = () =>
    Alert.alert(t('settings.export'), undefined, [
      {
        text: t('programs.title'),
        onPress: () =>
          void run(
            () => exportBackup({ programs: true, history: false }),
            t('settings.exportSuccess'),
          ),
      },
      {
        text: t('history.title'),
        onPress: () =>
          void run(
            () => exportBackup({ programs: false, history: true }),
            t('settings.exportSuccess'),
          ),
      },
      {
        text: `${t('programs.title')} + ${t('history.title')}`,
        onPress: () =>
          void run(
            () => exportBackup({ programs: true, history: true }),
            t('settings.exportSuccess'),
          ),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  const importFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const backup = await readBackupFile(result.assets[0]!.uri);
      Alert.alert(t('settings.import'), undefined, [
        {
          text: t('settings.merge'),
          onPress: () =>
            void run(() => restoreBackup(backup, 'merge'), t('settings.importSuccess')),
        },
        {
          text: t('settings.replace'),
          style: 'destructive',
          onPress: () =>
            void run(() => restoreBackup(backup, 'replace'), t('settings.importSuccess')),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    } catch {
      Alert.alert(t('settings.invalidBackup'));
    }
  };
  const clear = () =>
    Alert.alert(t('settings.clearTitle'), t('settings.clearBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.clear'),
        style: 'destructive',
        onPress: () => void clearAllData().then(reset),
      },
    ]);

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
      </View>
      <Text style={{ color: colors.textMuted }}>{t('settings.aboutOffline')}</Text>
      <Choice
        title={t('settings.language')}
        value={language}
        options={[
          ['ru', t('settings.russian')],
          ['en', t('settings.english')],
        ]}
        onChange={(value) => setLanguage(value as 'ru' | 'en')}
      />
      <Choice
        title={t('settings.units')}
        value={unit}
        options={[
          ['kg', t('settings.kilograms')],
          ['lb', t('settings.pounds')],
        ]}
        onChange={(value) => setUnit(value as 'kg' | 'lb')}
      />
      <Choice
        title={t('settings.theme')}
        value={theme}
        options={[
          ['system', t('settings.system')],
          ['light', t('settings.light')],
          ['dark', t('settings.dark')],
        ]}
        onChange={(value) => setTheme(value as 'system' | 'light' | 'dark')}
      />
      <View style={styles.restTimerSection}>
        <View style={styles.restTimerHeading}>
          <View style={styles.restTimerLabel}>
            <Text style={[styles.section, { color: colors.text }]}>{t('settings.restTimer')}</Text>
            <Text style={{ color: colors.textMuted }}>
              {restTimerEnabled ? t('settings.restTimerOn') : t('settings.restTimerOff')}
            </Text>
          </View>
          <Host matchContents>
            <Switch
              testID="rest-timer-switch"
              label={t('settings.restTimer')}
              value={restTimerEnabled}
              disabled={restTimerUpdating}
              onValueChange={(enabled) => void updateRestTimerEnabled(enabled)}
            />
          </Host>
        </View>
        <Text style={{ color: colors.textMuted }}>{t('settings.restTimerDuration')}</Text>
        <View style={styles.restTimerDuration}>
          <Button
            label="−30 sec"
            variant="secondary"
            accessibilityLabel={t('settings.decreaseRestTimer')}
            disabled={restTimerDurationSeconds <= MIN_REST_TIMER_SECONDS}
            onPress={() => setRestTimerDurationSeconds(restTimerDurationSeconds - 30)}
          />
          <Text style={[styles.restTimerValue, { color: colors.text }]}>
            {formatDuration(restTimerDurationSeconds)}
          </Text>
          <Button
            label="+30 sec"
            variant="secondary"
            accessibilityLabel={t('settings.increaseRestTimer')}
            disabled={restTimerDurationSeconds >= MAX_REST_TIMER_SECONDS}
            onPress={() => setRestTimerDurationSeconds(restTimerDurationSeconds + 30)}
          />
        </View>
      </View>
      <View style={styles.telegramSection}>
        <View style={styles.telegramHeading}>
          <Text style={[styles.section, { color: colors.text }]}>{t('settings.telegram')}</Text>
          <Text style={{ color: telegramConfigured ? colors.primary : colors.textMuted }}>
            {telegramConfigured
              ? t('settings.telegramConfigured')
              : t('settings.telegramNotConfigured')}
          </Text>
        </View>
        <Text style={{ color: colors.textMuted }}>{t('settings.telegramDescription')}</Text>
        <TextField
          label={t('settings.botToken')}
          value={telegramToken}
          onChangeText={setTelegramToken}
          secureTextEntry={!showTelegramToken}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!telegramLoading && !telegramSaving}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowTelegramToken((visible) => !visible)}
        >
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            {showTelegramToken ? t('settings.hideToken') : t('settings.showToken')}
          </Text>
        </Pressable>
        <TextField
          label={t('settings.chatId')}
          value={telegramChatId}
          onChangeText={setTelegramChatId}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!telegramLoading && !telegramSaving}
        />
        <View style={styles.telegramActions}>
          <Button
            label={t('settings.saveTelegram')}
            loading={telegramSaving}
            disabled={telegramLoading}
            onPress={() => void saveTelegram()}
          />
          <Button
            label={t('settings.removeTelegram')}
            variant="ghost"
            disabled={telegramLoading || telegramSaving}
            onPress={() => void removeTelegram()}
          />
        </View>
      </View>
      <View style={styles.dataSection}>
        <Text style={[styles.section, { color: colors.text }]}>{t('settings.data')}</Text>
        <View testID="settings-data-actions" style={styles.dataActions}>
          <Button label={t('settings.export')} variant="secondary" onPress={chooseExport} />
          <Button
            label={t('settings.import')}
            variant="secondary"
            onPress={() => void importFile()}
          />
          <Button label={t('settings.clear')} variant="danger" onPress={clear} />
        </View>
      </View>
      <Button label={t('common.goBack')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
function Choice({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      <Text style={[styles.section, { color: colors.text }]}>{title}</Text>
      <View style={styles.options}>
        {options.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.option,
              {
                borderColor: value === key ? colors.primary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text
              style={{ color: value === key ? colors.primary : colors.text, fontWeight: '700' }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
async function run(task: () => Promise<void>, success: string) {
  try {
    await task();
    Alert.alert(success);
  } catch (cause) {
    Alert.alert(cause instanceof Error ? cause.message : String(cause));
  }
}
function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
const styles = StyleSheet.create({
  content: { gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900' },
  group: { gap: 10 },
  section: { fontSize: 18, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  dataSection: { gap: 12, paddingTop: 8, paddingBottom: 4 },
  dataActions: { gap: 12 },
  telegramSection: { gap: 12, paddingTop: 8 },
  telegramHeading: { gap: 4 },
  telegramActions: { gap: 10 },
  restTimerSection: { gap: 12 },
  restTimerHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  restTimerLabel: { flex: 1, gap: 4 },
  restTimerDuration: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  restTimerValue: { minWidth: 56, textAlign: 'center', fontSize: 20, fontWeight: '800' },
});
