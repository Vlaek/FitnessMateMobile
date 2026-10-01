import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { NotificationTaskPayload } from 'expo-notifications';
import { Platform } from 'react-native';
import { REST_TIMER_STOP_ACTION_ID, restTimerService } from './rest-timer-service';

export const REST_TIMER_TASK_NAME = 'fitnessmate-rest-timer';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let Notifications: typeof import('expo-notifications') | null = null;
let TaskManager: typeof import('expo-task-manager') | null = null;

if (!isExpoGo) {
  // Expo Go throws while importing expo-notifications on Android SDK 53+.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  TaskManager = require('expo-task-manager');
}

if (Notifications && TaskManager && !TaskManager.isTaskDefined(REST_TIMER_TASK_NAME)) {
  TaskManager.defineTask<NotificationTaskPayload>(REST_TIMER_TASK_NAME, async ({ data }) => {
    if ('actionIdentifier' in data && data.actionIdentifier === REST_TIMER_STOP_ACTION_ID) {
      await restTimerService.stop();
    } else if (!('actionIdentifier' in data)) {
      const notificationData = parseNotificationData(data.data);

      if (
        notificationData.kind === 'restTimerComplete' &&
        typeof notificationData.activeNotificationId === 'string'
      ) {
        await restTimerService.dismissActive(notificationData.activeNotificationId);
      }
    }

    return Notifications.BackgroundNotificationTaskResult.NoData;
  });
}

function parseNotificationData(data: Record<string, unknown>): Record<string, unknown> {
  if (typeof data.dataString !== 'string') {
    return data;
  }

  try {
    const parsed: unknown = JSON.parse(data.dataString);

    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function registerRestTimer() {
  if (Platform.OS !== 'android' || !Notifications || !TaskManager) {
    return;
  }

  if (!(await TaskManager.isTaskRegisteredAsync(REST_TIMER_TASK_NAME))) {
    await Notifications.registerTaskAsync(REST_TIMER_TASK_NAME);
  }
}
