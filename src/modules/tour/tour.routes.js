'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { Tour, Notification } = require('../../db/models');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireActive } = require('../../middlewares/active');
const { requireRole } = require('../../middlewares/role');
const { validate } = require('../../middlewares/validate');
const { notFound, badRequest } = require('../../utils/errors');
const { toDateOnly } = require('../../utils/dates');

router.use(authenticate);
router.use(requireActive);

const serialize = (t) => ({
  id: t.id,
  place: t.place,
  fromDate: t.from_date,
  toDate: t.to_date,
  purpose: t.purpose,
  status: t.status,
});

router.get('/', asyncHandler(async (req, res) => {
  const tours = await Tour.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
  return ok(res, tours.map(serialize));
}));

router.post(
  '/',
  validate([
    body('place').isLength({ min: 1, max: 160 }),
    body('fromDate').isISO8601(),
    body('toDate').isISO8601(),
  ]),
  asyncHandler(async (req, res) => {
    const { place, fromDate, toDate, purpose } = req.body;
    const tour = await Tour.create({
      user_id: req.user.id,
      place,
      from_date: toDateOnly(fromDate, 'fromDate'),
      to_date: toDateOnly(toDate, 'toDate'),
      purpose: purpose || null,
    });
    return created(res, serialize(tour), 'Tour request submitted');
  })
);

router.put(
  '/:id/decision',
  requireRole('HR_ADMIN'),
  validate([body('status').isIn(['APPROVED', 'REJECTED'])]),
  asyncHandler(async (req, res) => {
    const tour = await Tour.findByPk(req.params.id);
    if (!tour) throw notFound('Tour not found');
    if (tour.status !== 'APPLIED') throw badRequest('Tour already decided');
    tour.status = req.body.status;
    tour.approver_id = req.user.id;
    await tour.save();
    await Notification.create({
      user_id: tour.user_id,
      title: `Tour ${req.body.status.toLowerCase()}`,
      body: `Your tour to ${tour.place} was ${req.body.status.toLowerCase()}.`,
    });
    return ok(res, serialize(tour), 'Tour decision saved');
  })
);

module.exports = router;
