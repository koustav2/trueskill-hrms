'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const service = require('./profile.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const { upload, publicUrl } = require('../../middlewares/upload');
const { badRequest } = require('../../utils/errors');

router.use(authenticate);

router.get('/profile', asyncHandler(async (req, res) => {
  const data = await service.getProfile(req.user.id);
  return ok(res, data);
}));

router.put(
  '/profile',
  validate([
    body('fullName').optional().isLength({ min: 2, max: 120 }),
    body('phone').optional({ values: 'falsy' }).matches(/^[+0-9\- ]{7,20}$/),
    body('address').optional({ values: 'falsy' }).isLength({ max: 255 }),
    body('pincode').optional({ values: 'falsy' }).isLength({ max: 12 }),
  ]),
  asyncHandler(async (req, res) => {
    const data = await service.updateProfile(req.user.id, req.body);
    return ok(res, data, 'Profile updated');
  })
);

router.post('/avatar', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('No file uploaded (field name: file)');
  const data = await service.setAvatar(req.user.id, publicUrl(req.file.filename));
  return ok(res, data, 'Avatar updated');
}));

module.exports = router;
