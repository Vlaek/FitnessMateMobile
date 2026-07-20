import { router } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/shared/theme/use-app-theme';
import { AppHeader } from '@/shared/ui/app-header';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

import { ProgramCard } from './program-card';
import { usePrograms } from './use-programs';

export function ProgramsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { items, isLoading, error, refresh, duplicate, remove, move } = usePrograms();
  const confirmDelete = (id: string) => Alert.alert(t('programs.deleteTitle'), t('programs.deleteBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.delete'), style: 'destructive', onPress: () => void remove(id) },
  ]);

  return (
    <Screen bottomInset="tabBar">
      <AppHeader title={t('programs.title')} actionLabel={t('settings.title')} onAction={() => router.push('/settings')} />
      {isLoading && items.length === 0 ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
      {error ? <View style={styles.error}><Text style={{ color: colors.danger }}>{error}</Text><Button variant="secondary" label={t('common.retry')} onPress={() => void refresh()} /></View> : null}
      {!isLoading && items.length === 0 ? (
        <EmptyState title={t('programs.emptyTitle')} body={t('programs.emptyBody')}
          actionLabel={t('programs.new')} onAction={() => router.push('/programs/new')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <ProgramCard program={item} first={index === 0} last={index === items.length - 1}
              onOpen={() => router.push(`/programs/${item.id}`)} onDuplicate={() => void duplicate(item.id)}
              onDelete={() => confirmDelete(item.id)} onMoveUp={() => void move(item.id, -1)}
              onMoveDown={() => void move(item.id, 1)} />
          )}
        />
      )}
      {items.length > 0 ? <View style={styles.floating}><Button label={t('programs.new')} onPress={() => router.push('/programs/new')} /></View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ loader: { flex: 1 }, list: { padding: 20, gap: 14, paddingBottom: 100 }, floating: { position: 'absolute', right: 20, bottom: 18 }, error: { paddingHorizontal: 20, gap: 8 } });
