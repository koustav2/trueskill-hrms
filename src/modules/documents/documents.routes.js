'use strict';

const router = require('express').Router();
const service = require('./documents.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/role');
const { upload, publicUrl } = require('../../middlewares/upload');

router.use(authenticate);

// List my documents
router.get('/', asyncHandler(async (req, res) => {
  const data = await service.listDocuments(req.user.id);
  return ok(res, data);
}));

// Upload/replace a document of :type (front + optional back image + optional number)
router.post(
  '/:type',
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'fileBack', maxCount: 1 }]),
  asyncHandler(async (req, res) => {
    const type = String(req.params.type).toUpperCase();
    const fileUrl = req.files?.file?.[0] ? publicUrl(req.files.file[0].filename) : undefined;
    const fileUrlBack = req.files?.fileBack?.[0] ? publicUrl(req.files.fileBack[0].filename) : undefined;
    const data = await service.uploadDocument(req.user.id, type, {
      fileUrl,
      fileUrlBack,
      number: req.body.number,
    });
    return created(res, data, 'Document uploaded');
  })
);

// HR: verify or reject a document
router.put(
  '/:id/verify',
  requireRole('HR_ADMIN'),
  asyncHandler(async (req, res) => {
    const data = await service.verifyDocument(req.params.id, req.user.id, req.body);
    return ok(res, data, 'Document reviewed');
  })
);

module.exports = router;
