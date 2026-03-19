/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest instead of jest-expo for pure logic tests
  // This avoids Expo's winter runtime scope issues
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowJs: true,
        paths: { '@/*': ['./*'] },
        baseUrl: '.',
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native-appwrite$': '<rootDir>/__tests__/__mocks__/appwrite.ts',
    '^react-native$': '<rootDir>/__tests__/__mocks__/react-native.ts',
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/__tests__/__mocks__/setup.ts'],
  collectCoverageFrom: [
    'stores/**/*.ts',
    'lib/db/**/*.ts',
    'utils/**/*.ts',
    '!**/index.ts',
    '!**/*.d.ts',
  ],
}
