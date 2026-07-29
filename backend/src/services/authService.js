const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/** Signs a JWT carrying only the minimum claims needed to authorize requests. */
function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

/**
 * Public self-registration. Always creates an ENGINEER account — the
 * assignment scopes "Register" to Engineer Features only; PM accounts are
 * provisioned out-of-band (seed data / an existing PM), never self-service,
 * so a client can never mint themselves a PM account by tampering with the
 * request body.
 */
async function register({ name, email, password }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcrypt.saltRounds);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'ENGINEER',
  });

  const token = generateToken(user);
  return { user: user.toSafeJSON(), token };
}

/** Validates credentials for both PM and ENGINEER accounts. */
async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user);
  return { user: user.toSafeJSON(), token };
}

module.exports = { register, login, generateToken };
