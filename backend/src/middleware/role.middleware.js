const ApiError = require('../utils/ApiError');

/**
 * Route-level authorization guard. Must run after requireAuth.
 * Usage: router.post('/tasks', requireAuth, requireRole('PM'), controller)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action requires role: ${allowedRoles.join(' or ')}`));
    }
    return next();
  };
}

module.exports = requireRole;
