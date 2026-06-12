'use strict';

const router = require('express').Router();
const service = require('./attendance.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { upload, publicUrl } = require('../../middlewares/upload');
const { badRequest } = require('../../utils/errors');

router.use(authenticate);

// Parses a coordinate from form/JSON input; returns null when absent or invalid.
function coord(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

router.get('/today', asyncHandler(async (req, res) => {
  return ok(res, await service.getToday(req.user.id));
}));

// Trims and length-caps a free-text address; returns null when empty.
function addr(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, 512) : null;
}

router.post('/check-in', upload.single('selfie'), asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('A selfie is required to check in');
  const selfieUrl = publicUrl(req.file.filename);
  return ok(
    res,
    await service.checkIn(req.user.id, selfieUrl, coord(req.body.lat), coord(req.body.lng), addr(req.body.address)),
    'Checked in'
  );
}));

router.post('/check-out', asyncHandler(async (req, res) => {
  return ok(
    res,
    await service.checkOut(req.user.id, coord(req.body.lat), coord(req.body.lng), addr(req.body.address)),
    'Checked out'
  );
}));

router.get('/', asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  return ok(res, await service.history(req.user.id, month && Number(month), year && Number(year)));
}));

module.exports = router;
