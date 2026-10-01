jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'storeClient' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

jest.mock('expo-notifications', () => {
  throw new Error('expo-notifications is unavailable in Expo Go');
});

describe('rest timer in Expo Go', () => {
  it('loads the service and registration modules without loading notifications', () => {
    expect(() => jest.requireActual('./rest-timer-service')).not.toThrow();
    expect(() => jest.requireActual('./register-rest-timer')).not.toThrow();
  });
});
