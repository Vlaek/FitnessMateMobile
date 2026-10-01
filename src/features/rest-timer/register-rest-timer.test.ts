import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { restTimerService } from './rest-timer-service';
import { registerRestTimer } from './register-rest-timer';

jest.mock('expo-notifications', () => ({
  registerTaskAsync: jest.fn(),
  BackgroundNotificationTaskResult: { NoData: 1 },
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => false),
  isTaskRegisteredAsync: jest.fn(),
}));

jest.mock('./rest-timer-service', () => ({
  REST_TIMER_STOP_ACTION_ID: 'stop-rest-timer',
  restTimerService: { stop: jest.fn() },
}));

const taskExecutor = jest.mocked(TaskManager.defineTask).mock.calls[0]?.[1];

describe('registerRestTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.mocked(TaskManager.isTaskDefined).mockReturnValue(false);
    jest.mocked(TaskManager.isTaskRegisteredAsync).mockResolvedValue(false);
    jest.mocked(Notifications.registerTaskAsync).mockResolvedValue(null);
  });

  it('defines a task whose stop action cancels the active timer', async () => {
    await taskExecutor?.({
      data: { actionIdentifier: 'stop-rest-timer' },
      error: null,
      executionInfo: { taskName: 'fitnessmate-rest-timer', eventId: 'event-1' },
    });

    expect(restTimerService.stop).toHaveBeenCalledTimes(1);
  });

  it('registers the task once on Android', async () => {
    await registerRestTimer();

    expect(Notifications.registerTaskAsync).toHaveBeenCalledWith('fitnessmate-rest-timer');
  });
});
