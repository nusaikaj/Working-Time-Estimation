const { body, param, query } = require('express-validator');

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const listTasksValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status filter'),
  query('search').optional().isString().trim().isLength({ max: 200 }),
];

const createTaskValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title is too long'),
  body('description').optional({ nullable: true }).isString().isLength({ max: 5000 }).withMessage('Description is too long'),
  body('assignedEngineer').optional({ nullable: true }).isInt({ min: 1 }).withMessage('assignedEngineer must be a valid user id'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
];

const updateTaskValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
];

const assignTaskValidator = [
  body('assignedEngineer').isInt({ min: 1 }).withMessage('assignedEngineer is required and must be a valid user id'),
];

// Fractional working-day estimate. Bounded to a generous sane range purely to
// reject fat-fingered garbage (e.g. accidentally pasting a timestamp) — the
// algorithm itself places no mathematical limit on magnitude.
const estimateValidator = [
  body('estimateDays')
    .isFloat({ min: -3650, max: 3650 })
    .withMessage('estimateDays must be a number between -3650 and 3650'),
];

const calculateTaskValidator = [
  body('startDateTime').isISO8601().withMessage('startDateTime must be a valid ISO 8601 date-time'),
];

module.exports = {
  idParamValidator,
  listTasksValidator,
  createTaskValidator,
  updateTaskValidator,
  assignTaskValidator,
  estimateValidator,
  calculateTaskValidator,
};
