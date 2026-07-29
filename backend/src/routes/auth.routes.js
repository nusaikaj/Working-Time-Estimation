const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');

const router = Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.get('/me', requireAuth, authController.me);

module.exports = router;
