module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: { '\\.css$': '<rootDir>/src/test/styleMock.cjs' },
  testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)'],
  clearMocks: true,
};
