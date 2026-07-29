module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/services/timeCalculationService.js'],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    'src/services/timeCalculationService.js': {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
  },
  verbose: true,
  testTimeout: 15000,
};
