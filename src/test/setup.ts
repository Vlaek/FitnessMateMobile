jest.mock('react-native-safe-area-context', () => {
  const safeAreaMock = jest.requireActual<{ default?: object }>(
    'react-native-safe-area-context/jest/mock',
  );
  return safeAreaMock.default ?? safeAreaMock;
});

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

afterEach(() => {
  jest.clearAllMocks();
});
