// Tests are compiled with tsc first (see the "test" script), so Jest runs plain ES modules.
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/build-test/tests'],
  testMatch: ['**/*.test.js'],
  globalSetup: '<rootDir>/build-test/tests/globalSetup.js',
  setupFiles: ['<rootDir>/build-test/tests/setupEnv.js'],
  transform: {},
};
