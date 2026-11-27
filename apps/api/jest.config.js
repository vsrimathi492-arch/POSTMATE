module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@postmate/shared$': '<rootDir>/../../packages/shared/src'
  },
  testTimeout: 15000
};
