import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/shared/ui/app-header';
import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export default function ProgramsRoute() {
  const { t } = useTranslation();
  return (
    <Screen bottomInset="tabBar">
      <AppHeader title={t('programs.title')} actionLabel={t('settings.title')} onAction={() => router.push('/settings')} />
      <EmptyState title={t('programs.emptyTitle')} body={t('programs.emptyBody')}
        actionLabel={t('programs.new')} onAction={() => router.push('/programs/new')} />
    </Screen>
  );
}
