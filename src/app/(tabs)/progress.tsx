import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/shared/ui/app-header';
import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export default function ProgressScreen() {
  const { t } = useTranslation();
  return <Screen bottomInset="tabBar"><AppHeader title={t('progress.title')} /><EmptyState title={t('progress.emptyTitle')} body={t('progress.emptyBody')} /></Screen>;
}
