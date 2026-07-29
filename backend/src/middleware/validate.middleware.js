const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after an express-validator chain (see src/validators/*). If any rule
 * failed, short-circuits with a 400 instead of letting the request reach the
 * controller. Keeps controllers free of manual validation checks.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest('Validation failed', errors));
}

module.exports = validate;
