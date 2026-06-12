'use strict';

const router = require('express').Router();
const authRoutes = require('./modules/auth/auth.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const documentsRoutes = require('./modules/documents/documents.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const leaveRoutes = require('./modules/leave/leave.routes');
const salaryRoutes = require('./modules/salary/salary.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const tourRoutes = require('./modules/tour/tour.routes');
const advanceRoutes = require('./modules/advance/advance.routes');
const noticesRoutes = require('./modules/notices/notices.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const { authenticate } = require('./middlewares/auth');
const { ok } = require('./utils/response');

// Health check
router.get('/health', (_req, res) => ok(res, { status: 'up', time: new Date().toISOString() }));

// Auth
router.use('/auth', authRoutes);

// Lightweight identity check
router.get('/me', authenticate, (req, res) => ok(res, { user: req.user }));

// Feature modules
router.use('/me', profileRoutes);          // /me/profile, /me/avatar
router.use('/documents', documentsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/salary-slips', salaryRoutes);
router.use('/tasks', tasksRoutes);
router.use('/tours', tourRoutes);
router.use('/advances', advanceRoutes);
router.use('/admin', adminRoutes);         // HR_ADMIN only
router.use('/', noticesRoutes);            // /notices, /notifications

module.exports = router;
