const { Router } = require('express');
const holidayController = require('../controllers/holiday.controller');
const requireAuth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const {
  recurringHolidayValidator,
  oneTimeHolidayValidator,
  idParamValidator,
} = require('../validators/holiday.validator');

const router = Router();

router.get('/recurring', requireAuth, holidayController.listRecurring);
router.post('/recurring', requireAuth, requireRole('PM'), recurringHolidayValidator, validate, holidayController.addRecurring);
router.delete('/recurring/:id', requireAuth, requireRole('PM'), idParamValidator, validate, holidayController.removeRecurring);

router.get('/one-time', requireAuth, holidayController.listOneTime);
router.post('/one-time', requireAuth, requireRole('PM'), oneTimeHolidayValidator, validate, holidayController.addOneTime);
router.delete('/one-time/:id', requireAuth, requireRole('PM'), idParamValidator, validate, holidayController.removeOneTime);

module.exports = router;
