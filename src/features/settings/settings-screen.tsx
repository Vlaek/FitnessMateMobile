import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  clearAllData,
  exportBackup,
  readBackupFile,
  restoreBackup,
} from '@/features/backup/backup-service';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';

import { usePreferencesStore } from './preferences-store';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const unit = usePreferencesStore((s) => s.weightUnit);
  const setUnit = usePreferencesStore((s) => s.setWeightUnit);
  const theme = usePreferencesStore((s) => s.themeMode);
  const setTheme = usePreferencesStore((s) => s.setThemeMode);
  const reset = usePreferencesStore((s) => s.reset);
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
    <Screen scroll contentStyle={styles.content}>
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
});
