/**
 * Consistent success envelope for every endpoint: { success, message, data }.
 * Pairs with ApiError, which produces the equivalent failure envelope.
 */
class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  send(res, statusCode = 200) {
    return res.status(statusCode).json(this);
  }
}

module.exports = ApiResponse;
