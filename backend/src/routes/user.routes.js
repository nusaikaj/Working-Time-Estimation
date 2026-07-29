const { Router } = require('express');
const userController = require('../controllers/user.controller');
const requireAuth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { handleAvatarUpload } = require('../middleware/upload.middleware');
const { updateProfileValidator } = require('../validators/user.validator');

const router = Router();

router.get('/engineers', requireAuth, requireRole('PM'), userController.listEngineers);

router.patch('/me', requireAuth, updateProfileValidator, validate, userController.updateMe);
router.patch('/me/avatar', requireAuth, handleAvatarUpload, userController.uploadAvatar);
router.delete('/me/avatar', requireAuth, userController.removeAvatar);

module.exports = router;
