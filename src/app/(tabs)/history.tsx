import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/shared/ui/app-header';
import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export default function HistoryScreen() {
  const { t } = useTranslation();
  return <Screen bottomInset="tabBar"><AppHeader title={t('history.title')} /><EmptyState title={t('history.emptyTitle')} body={t('history.emptyBody')} /></Screen>;
}
