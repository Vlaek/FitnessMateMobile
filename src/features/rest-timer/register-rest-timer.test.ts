import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { registerRestTimer } from './register-rest-timer';
import { restTimerService } from './rest-timer-service';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

jest.mock('expo-notifications', () => ({
  registerTaskAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  BackgroundNotificationTaskResult: { NoData: 1 },
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => false),
  isTaskRegisteredAsync: jest.fn(),
}));

jest.mock('./rest-timer-service', () => ({
  REST_TIMER_STOP_ACTION_ID: 'stop-rest-timer',
  restTimerService: { dismissActive: jest.fn(), stop: jest.fn() },
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

  it('shows rest timer notifications while the app is in the foreground', async () => {
    await registerRestTimer();

    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls[0]?.[0];

    await expect(handler?.handleNotification({} as Notifications.Notification)).resolves.toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });

  it('defines a task whose stop action cancels the active timer', async () => {
    await taskExecutor?.({
      data: { actionIdentifier: 'stop-rest-timer' },
      error: null,
      executionInfo: { taskName: 'fitnessmate-rest-timer', eventId: 'event-1' },
    });

    expect(restTimerService.stop).toHaveBeenCalledTimes(1);
  });

  it('dismisses the active notification when the completion notification arrives', async () => {
    await taskExecutor?.({
      data: {
        notification: {},
        data: {
          dataString: JSON.stringify({
            kind: 'restTimerComplete',
            activeNotificationId: 'active-id',
          }),
        },
      },
      error: null,
      executionInfo: { taskName: 'fitnessmate-rest-timer', eventId: 'event-2' },
    });

    expect(restTimerService.dismissActive).toHaveBeenCalledWith('active-id');
  });

  it('registers the task once on Android', async () => {
    await registerRestTimer();

    expect(Notifications.registerTaskAsync).toHaveBeenCalledWith('fitnessmate-rest-timer');
  });
});
