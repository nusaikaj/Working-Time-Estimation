/**
 * A typed error carrying an HTTP status code so the central error handler
 * can respond correctly without guessing. Controllers/services throw these
 * instead of plain Error objects for anything that should reach the client
 * as a specific 4xx/5xx.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {Array<{ field?: string, message: string }>} [errors] field-level validation errors
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // distinguishes expected errors from bugs/crashes
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
