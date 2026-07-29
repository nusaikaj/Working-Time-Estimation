const { ValidationError, UniqueConstraintError } = require('sequelize');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Normalises every thrown error (ApiError, Sequelize errors, or an unexpected
 * bug) into the same { success: false, message, errors } JSON envelope.
 * Must be registered last, after all routes.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message = 'A record with these details already exists';
    errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  if (!err.isOperational && statusCode === 500) {
    logger.error(err);
  }

  const payload = { success: false, message, errors };
  if (env.nodeEnv === 'development' && statusCode === 500) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

/** Registered before errorHandler for any request that matched no route. */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFoundHandler };
