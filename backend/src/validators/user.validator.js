const { body } = require('express-validator');

const updateProfileValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }).withMessage('Name is too long'),
];

module.exports = { updateProfileValidator };
