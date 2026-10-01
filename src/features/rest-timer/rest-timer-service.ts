import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { i18n } from '@/shared/i18n';

export const REST_TIMER_CHANNEL_ID = 'rest-timer';
export const REST_TIMER_CATEGORY_ID = 'resttimer';
export const REST_TIMER_STOP_ACTION_ID = 'stop-rest-timer';

let activeNotificationId: string | null = null;
let completionNotificationId: string | null = null;

function canUseNotifications() {
  return (
    Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

function getNotifications(): typeof import('expo-notifications') {
  // Expo Go throws while importing expo-notifications on Android SDK 53+.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications');
}

async function requestPermission(): Promise<boolean> {
  if (!canUseNotifications()) {
    return false;
  }

  const Notifications = getNotifications();
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted;
}

async function configureNotifications(Notifications: typeof import('expo-notifications')) {
  await Notifications.setNotificationChannelAsync(REST_TIMER_CHANNEL_ID, {
    name: i18n.t('settings.restTimer'),
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationCategoryAsync(REST_TIMER_CATEGORY_ID, [
    {
      identifier: REST_TIMER_STOP_ACTION_ID,
      buttonTitle: i18n.t('restTimer.stop'),
      options: { opensAppToForeground: false },
    },
  ]);
}

async function stop() {
  if (!canUseNotifications()) {
    return;
  }

  const Notifications = getNotifications();
  const completionId = completionNotificationId;
  const activeId = activeNotificationId;
  completionNotificationId = null;
  activeNotificationId = null;

  if (completionId) {
    await Notifications.cancelScheduledNotificationAsync(completionId).catch(() => undefined);
  }

  if (activeId) {
    await Notifications.dismissNotificationAsync(activeId).catch(() => undefined);
  }
}

async function start(durationSeconds: number, now = new Date()) {
  if (!canUseNotifications()) {
    return;
  }

  const Notifications = getNotifications();
  await stop();
  await configureNotifications(Notifications);

  const endsAt = new Date(now.getTime() + durationSeconds * 1000);
  const time = endsAt.toLocaleTimeString(i18n.language, {
    hour: '2-digit',
    minute: '2-digit',
  });

  activeNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('settings.restTimer'),
      body: i18n.t('restTimer.until', { time }),
      categoryIdentifier: REST_TIMER_CATEGORY_ID,
      sticky: true,
      autoDismiss: false,
      data: { kind: 'restTimerActive' },
    },
    trigger: null,
  });

  completionNotificationId = await Notifications.scheduleNotificationAsync({
    identifier: activeNotificationId,
    content: {
      title: i18n.t('restTimer.complete'),
      data: { kind: 'restTimerComplete' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: durationSeconds,
      channelId: REST_TIMER_CHANNEL_ID,
    },
  });
}

export const restTimerService = {
  isAvailable: canUseNotifications,
  requestPermission,
  start,
  stop,
};
