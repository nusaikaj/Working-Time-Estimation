const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const taskRoutes = require('./task.routes');
const settingsRoutes = require('./settings.routes');
const holidayRoutes = require('./holiday.routes');

const router = Router();

/** Lightweight liveness probe — used by Docker healthcheck and CI. */
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/settings', settingsRoutes);
router.use('/holidays', holidayRoutes);

module.exports = router;
