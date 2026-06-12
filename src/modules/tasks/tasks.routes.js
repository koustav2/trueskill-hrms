'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { Task } = require('../../db/models');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireActive } = require('../../middlewares/active');
const { validate } = require('../../middlewares/validate');
const { notFound, badRequest } = require('../../utils/errors');
const { toDateOnly } = require('../../utils/dates');

router.use(authenticate);
router.use(requireActive);

const serialize = (t) => ({
  id: t.id,
  title: t.title,
  dueDate: t.due_date,
  priority: t.priority,
  status: t.status,
});

router.get('/', asyncHandler(async (req, res) => {
  const tasks = await Task.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
  return ok(res, tasks.map(serialize));
}));

router.post(
  '/',
  validate([body('title').isLength({ min: 1, max: 200 })]),
  asyncHandler(async (req, res) => {
    const { title, dueDate, priority } = req.body;
    const task = await Task.create({
      user_id: req.user.id,
      title,
      due_date: toDateOnly(dueDate, 'dueDate'),
      priority: priority || 'MEDIUM',
    });
    return created(res, serialize(task), 'Task created');
  })
);

router.patch(
  '/:id/status',
  validate([body('status').isIn(['NOT_DONE', 'IN_PROGRESS', 'COMPLETED'])]),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!task) throw notFound('Task not found');
    task.status = req.body.status;
    await task.save();
    return ok(res, serialize(task), 'Task updated');
  })
);

module.exports = router;
