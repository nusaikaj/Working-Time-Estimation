const { body } = require('express-validator');

// At least 8 chars, one uppercase, one lowercase, one digit, one special char.
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }).withMessage('Name is too long'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character'),
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };
