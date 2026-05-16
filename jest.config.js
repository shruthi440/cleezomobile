module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@react-navigation/native$': '<rootDir>/__mocks__/react-navigation-native.js',
    '^@react-navigation/native-stack$': '<rootDir>/__mocks__/react-navigation-native-stack.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/asyncStorageMock.js',
    '^react-native-responsive-screen$': '<rootDir>/__mocks__/responsiveScreenMock.js',
    '^react-native-vector-icons/.*$': '<rootDir>/__mocks__/VectorIconMock.js',
    '^@react-native-firebase/messaging$': '<rootDir>/__mocks__/messagingMock.js',
  },
};
