'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { Notice, Notification } = require('../../db/models');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/role');
const { validate } = require('../../middlewares/validate');
const { notFound } = require('../../utils/errors');

// Auth applied per-route (this router is mounted at '/', so a global
// middleware would intercept unmatched routes and mask 404s).

// ── Notices (company-wide announcements) ────────────────
router.get('/notices', authenticate, asyncHandler(async (req, res) => {
  const notices = await Notice.findAll({ order: [['created_at', 'DESC']], limit: 100 });
  return ok(res, notices.map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.created_at })));
}));

router.post(
  '/notices',
  authenticate,
  requireRole('HR_ADMIN'),
  validate([body('title').isLength({ min: 1, max: 200 }), body('body').isLength({ min: 1 })]),
  asyncHandler(async (req, res) => {
    const notice = await Notice.create({ title: req.body.title, body: req.body.body, created_by: req.user.id });
    return created(res, { id: notice.id, title: notice.title, body: notice.body }, 'Notice published');
  })
);

// ── Personal notifications ──────────────────────────────
router.get('/notifications', authenticate, asyncHandler(async (req, res) => {
  const rows = await Notification.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']], limit: 100 });
  return ok(res, rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    read: !!n.read_at,
    createdAt: n.created_at,
  })));
}));

router.patch('/notifications/:id/read', authenticate, asyncHandler(async (req, res) => {
  const n = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!n) throw notFound('Notification not found');
  n.read_at = new Date();
  await n.save();
  return ok(res, { id: n.id, read: true }, 'Marked as read');
}));

module.exports = router;
