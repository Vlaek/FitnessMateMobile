import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  REST_TIMER_CATEGORY_ID,
  REST_TIMER_CHANNEL_ID,
  restTimerService,
} from './rest-timer-service';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  PermissionStatus: { DENIED: 'denied', GRANTED: 'granted' },
}));

jest.mock('@/shared/i18n', () => ({
  i18n: {
    t: (key: string, values?: { time?: string }) => (values?.time ? `${key}:${values.time}` : key),
  },
}));

const mockNotifications = jest.mocked(Notifications);

describe('restTimerService', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
    mockNotifications.getPermissionsAsync.mockReset();
    mockNotifications.requestPermissionsAsync.mockReset();
    mockNotifications.setNotificationChannelAsync.mockReset();
    mockNotifications.setNotificationCategoryAsync.mockReset();
    mockNotifications.scheduleNotificationAsync.mockReset();
    mockNotifications.cancelScheduledNotificationAsync.mockReset();
    mockNotifications.dismissNotificationAsync.mockReset();
    mockNotifications.setNotificationChannelAsync.mockResolvedValue(null);
    mockNotifications.setNotificationCategoryAsync.mockResolvedValue({
      identifier: REST_TIMER_CATEGORY_ID,
      actions: [],
    });
    mockNotifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    mockNotifications.dismissNotificationAsync.mockResolvedValue(undefined);
  });

  it('requests Android notification permission when it is not already granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: 'never',
      status: Notifications.PermissionStatus.DENIED,
    });
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: 'never',
      status: Notifications.PermissionStatus.GRANTED,
    });
    await expect(restTimerService.requestPermission()).resolves.toBe(true);
    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('starts an active notification and schedules completion', async () => {
    mockNotifications.scheduleNotificationAsync
      .mockResolvedValueOnce('active-id')
      .mockResolvedValueOnce('completion-id');
    await restTimerService.start(180, new Date('2026-10-01T12:00:00.000Z'));

    expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      REST_TIMER_CHANNEL_ID,
      expect.objectContaining({ name: expect.any(String) }),
    );
    expect(mockNotifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      REST_TIMER_CATEGORY_ID,
      expect.any(Array),
    );
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        identifier: 'fitnessmate-rest-timer-active',
        trigger: null,
      }),
    );
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        content: expect.objectContaining({
          data: expect.objectContaining({
            activeNotificationId: 'fitnessmate-rest-timer-active',
          }),
        }),
        identifier: 'fitnessmate-rest-timer-completion',
        trigger: expect.objectContaining({ seconds: 180, channelId: REST_TIMER_CHANNEL_ID }),
      }),
    );
  });

  it('cancels and dismisses the previous timer before restarting', async () => {
    mockNotifications.scheduleNotificationAsync
      .mockResolvedValueOnce('active-1')
      .mockResolvedValueOnce('completion-1')
      .mockResolvedValueOnce('active-2')
      .mockResolvedValueOnce('completion-2');
    await restTimerService.start(180);
    await restTimerService.start(90);

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'fitnessmate-rest-timer-completion',
    );
    expect(mockNotifications.dismissNotificationAsync).toHaveBeenCalledWith(
      'fitnessmate-rest-timer-active',
    );
  });

  it('stops the timer after the JavaScript process loses its in-memory state', async () => {
    await restTimerService.stop();

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'fitnessmate-rest-timer-completion',
    );
    expect(mockNotifications.dismissNotificationAsync).toHaveBeenCalledWith(
      'fitnessmate-rest-timer-active',
    );
  });

  it('does not call notification APIs outside Android', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    await expect(restTimerService.requestPermission()).resolves.toBe(false);
    await restTimerService.start(180);
    await restTimerService.stop();

    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
