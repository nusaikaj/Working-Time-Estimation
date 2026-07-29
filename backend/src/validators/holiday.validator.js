const { body, param } = require('express-validator');

const recurringHolidayValidator = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('month must be an integer between 1 and 12'),
  body('day').isInt({ min: 1, max: 31 }).withMessage('day must be an integer between 1 and 31'),
];

const oneTimeHolidayValidator = [
  body('holidayDate').isISO8601().withMessage('holidayDate must be a valid date (YYYY-MM-DD)'),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

module.exports = { recurringHolidayValidator, oneTimeHolidayValidator, idParamValidator };
