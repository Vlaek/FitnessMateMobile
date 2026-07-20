import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/shared/ui/empty-state';
import { AppHeader } from '@/shared/ui/app-header';
import { Screen } from '@/shared/ui/screen';

export default function StartScreen() {
  const { t } = useTranslation();
  return (
    <Screen bottomInset="tabBar">
      <AppHeader title={t('start.title')} />
      <EmptyState title={t('start.choose')} body={t('start.unfinished')}
        actionLabel={t('programs.new')} onAction={() => router.push('/programs/new')} />
    </Screen>
  );
}
