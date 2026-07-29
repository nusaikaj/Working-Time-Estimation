// Runs once per test file after the test framework is installed.
// Ensures NODE_ENV=test is respected (so config/env.js picks the test DB)
// regardless of how the individual test runner was invoked.
process.env.NODE_ENV = 'test';
