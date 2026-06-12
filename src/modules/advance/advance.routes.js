'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { Advance, Notification } = require('../../db/models');
const { encrypt, decrypt } = require('../../utils/crypto');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/role');
const { validate } = require('../../middlewares/validate');
const { notFound, badRequest } = require('../../utils/errors');

router.use(authenticate);

const serialize = (a) => ({
  id: a.id,
  amount: Number(decrypt(a.amount_enc)),
  reason: a.reason,
  status: a.status,
});

router.get('/', asyncHandler(async (req, res) => {
  const rows = await Advance.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
  return ok(res, rows.map(serialize));
}));

router.post(
  '/',
  validate([body('amount').isFloat({ gt: 0 })]),
  asyncHandler(async (req, res) => {
    const adv = await Advance.create({
      user_id: req.user.id,
      amount_enc: encrypt(String(req.body.amount)), // encrypted at rest
      reason: req.body.reason || null,
    });
    return created(res, serialize(adv), 'Advance requested');
  })
);

router.put(
  '/:id/decision',
  requireRole('HR_ADMIN'),
  validate([body('status').isIn(['APPROVED', 'REJECTED'])]),
  asyncHandler(async (req, res) => {
    const adv = await Advance.findByPk(req.params.id);
    if (!adv) throw notFound('Advance not found');
    if (adv.status !== 'APPLIED') throw badRequest('Advance already decided');
    adv.status = req.body.status;
    adv.approver_id = req.user.id;
    await adv.save();
    await Notification.create({
      user_id: adv.user_id,
      title: `Advance ${req.body.status.toLowerCase()}`,
      body: `Your advance request was ${req.body.status.toLowerCase()}.`,
    });
    return ok(res, serialize(adv), 'Advance decision saved');
  })
);

module.exports = router;
