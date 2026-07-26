jest.mock('react-native-safe-area-context', () => {
  const safeAreaMock = jest.requireActual<{ default?: object }>(
    'react-native-safe-area-context/jest/mock',
  );
  return safeAreaMock.default ?? safeAreaMock;
});

jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/src/mock')
);
jest.mock('react-native-reanimated', () =>
  jest.requireActual('react-native-reanimated/mock')
);

afterEach(() => {
  jest.clearAllMocks();
});
