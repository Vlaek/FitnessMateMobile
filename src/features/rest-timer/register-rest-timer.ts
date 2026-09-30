import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { REST_TIMER_STOP_ACTION_ID, restTimerService } from './rest-timer-service';

export const REST_TIMER_TASK_NAME = 'fitnessmate-rest-timer';

if (!TaskManager.isTaskDefined(REST_TIMER_TASK_NAME)) {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(
    REST_TIMER_TASK_NAME,
    async ({ data }) => {
      if ('actionIdentifier' in data && data.actionIdentifier === REST_TIMER_STOP_ACTION_ID) {
        await restTimerService.stop();
      }

      return Notifications.BackgroundNotificationTaskResult.NoData;
    },
  );
}

export async function registerRestTimer() {
  if (Platform.OS !== 'android') {
    return;
  }

  if (!(await TaskManager.isTaskRegisteredAsync(REST_TIMER_TASK_NAME))) {
    await Notifications.registerTaskAsync(REST_TIMER_TASK_NAME);
  }
}
