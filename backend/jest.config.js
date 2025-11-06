export default {
  testEnvironment: 'node',
  transform: {},
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js$',
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
