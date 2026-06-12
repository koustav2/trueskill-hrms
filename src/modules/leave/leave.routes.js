'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const service = require('./leave.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/role');
const { validate } = require('../../middlewares/validate');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  return ok(res, await service.listLeaves(req.user.id, req.query.status));
}));

router.get('/balance', asyncHandler(async (req, res) => {
  return ok(res, await service.getBalance(req.user.id));
}));

router.post(
  '/',
  validate([
    body('type').isIn(['CL', 'SL', 'PL', 'ML']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ]),
  asyncHandler(async (req, res) => {
    return created(res, await service.applyLeave(req.user.id, req.body), 'Leave applied');
  })
);

// HR: approve/reject
router.put(
  '/:id/decision',
  requireRole('HR_ADMIN'),
  validate([body('status').isIn(['APPROVED', 'REJECTED'])]),
  asyncHandler(async (req, res) => {
    return ok(res, await service.decide(req.params.id, req.user.id, req.body), 'Leave decision saved');
  })
);

module.exports = router;
