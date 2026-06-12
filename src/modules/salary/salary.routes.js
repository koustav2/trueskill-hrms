'use strict';

const router = require('express').Router();
const service = require('./salary.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/role');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  return ok(res, await service.listSlips(req.user.id));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  return ok(res, await service.getSlip(req.user.id, req.params.id, req.user.role));
}));

// HR: issue a slip
router.post('/', requireRole('HR_ADMIN'), asyncHandler(async (req, res) => {
  return created(res, await service.createSlip(req.body), 'Salary slip created');
}));

module.exports = router;
