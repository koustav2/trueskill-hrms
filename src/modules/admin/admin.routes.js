'use strict';

const router = require('express').Router();
const service = require('./admin.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/role');

// All admin routes require HR_ADMIN.
router.use(authenticate, requireRole('HR_ADMIN'));

router.get('/summary', asyncHandler(async (_req, res) => {
  return ok(res, await service.counts());
}));

router.get('/employees', asyncHandler(async (req, res) => {
  return ok(res, await service.listEmployees(req.query.status));
}));

router.get('/employees/:id', asyncHandler(async (req, res) => {
  return ok(res, await service.employeeDetail(req.params.id));
}));

// Suspend / reactivate an employee. Body: { action: 'SUSPEND' | 'REACTIVATE' }
router.put('/employees/:id/status', asyncHandler(async (req, res) => {
  return ok(res, await service.setEmployeeStatus(req.params.id, req.body.action), 'Employee status updated');
}));

router.get('/leaves', asyncHandler(async (req, res) => {
  return ok(res, await service.pendingLeaves(req.query.status || 'APPLIED'));
}));

router.get('/tours', asyncHandler(async (req, res) => {
  return ok(res, await service.pendingTours(req.query.status || 'APPLIED'));
}));

router.get('/advances', asyncHandler(async (req, res) => {
  return ok(res, await service.pendingAdvances(req.query.status || 'APPLIED'));
}));

router.get('/attendance', asyncHandler(async (req, res) => {
  return ok(res, await service.attendanceRecords({ date: req.query.date, userId: req.query.userId }));
}));

module.exports = router;
