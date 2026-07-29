const { Router } = require('express');
const settingsController = require('../controllers/settings.controller');
const requireAuth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { updateSettingsValidator } = require('../validators/settings.validator');

const router = Router();

router.get('/', requireAuth, settingsController.getSettings);
router.put('/', requireAuth, requireRole('PM'), updateSettingsValidator, validate, settingsController.updateSettings);

module.exports = router;
