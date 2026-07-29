const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies the Bearer JWT and attaches the current user to req.user.
 * Re-fetches the user from the DB on every request (rather than trusting the
 * token payload alone) so a deleted account or changed role takes effect
 * immediately instead of only once the token expires.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  const decoded = jwt.verify(token, env.jwt.secret);

  const user = await User.findByPk(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  req.user = user;
  next();
});

module.exports = requireAuth;
