jest.mock('react-native-safe-area-context', () => {
  const safeAreaMock = jest.requireActual<{ default?: object }>(
    'react-native-safe-area-context/jest/mock',
  );
  return safeAreaMock.default ?? safeAreaMock;
});

afterEach(() => {
  jest.clearAllMocks();
});
