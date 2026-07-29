/**
 * Minimal, dependency-free logger. Swap this out for pino/winston in a real
 * production deployment — kept intentionally simple here since it's not the
 * focus of the assignment, but centralised so that swap is a one-file change.
 */
/* eslint-disable no-console */
const env = require('../config/env');

const noop = () => {};

const logger = {
  info: env.isTest ? noop : (...args) => console.log('[INFO]', ...args),
  warn: env.isTest ? noop : (...args) => console.warn('[WARN]', ...args),
  error: env.isTest ? noop : (...args) => console.error('[ERROR]', ...args),
};

module.exports = logger;
