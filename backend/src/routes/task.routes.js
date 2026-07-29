const { Router } = require('express');
const taskController = require('../controllers/task.controller');
const requireAuth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const {
  idParamValidator,
  listTasksValidator,
  createTaskValidator,
  updateTaskValidator,
  assignTaskValidator,
  estimateValidator,
  calculateTaskValidator,
} = require('../validators/task.validator');

const router = Router();

router.use(requireAuth);

router.get('/', listTasksValidator, validate, taskController.list);
router.get('/stats', taskController.stats);
router.get('/:id', idParamValidator, validate, taskController.getById);

router.post('/', requireRole('PM'), createTaskValidator, validate, taskController.create);
router.patch('/:id', requireRole('PM'), idParamValidator, updateTaskValidator, validate, taskController.update);
router.patch('/:id/assign', requireRole('PM'), idParamValidator, assignTaskValidator, validate, taskController.assign);
router.post('/:id/calculate', requireRole('PM'), idParamValidator, calculateTaskValidator, validate, taskController.calculate);

router.patch('/:id/estimate', requireRole('ENGINEER'), idParamValidator, estimateValidator, validate, taskController.submitEstimate);

module.exports = router;
