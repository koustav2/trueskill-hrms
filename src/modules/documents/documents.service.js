'use strict';

const { Op } = require('sequelize');
const { Document, User, LeaveBalance, Notification, sequelize } = require('../../db/models');
const { encrypt } = require('../../utils/crypto');
const { nextEmployeeCode } = require('../../utils/employeeId');
const { badRequest, notFound } = require('../../utils/errors');
const { sendMail } = require('../../config/mailer');
const logger = require('../../utils/logger');

const REQUIRED_TYPES = ['AADHAR', 'PAN', 'BANK', 'QUALIFICATION'];

function serialize(doc) {
  return {
    id: doc.id,
    type: doc.type,
    fileUrl: doc.file_url,
    fileUrlBack: doc.file_url_back,
    status: doc.status,
    remarks: doc.remarks,
    // Note: the encrypted number is never returned to clients.
  };
}

async function listDocuments(userId) {
  const docs = await Document.findAll({ where: { user_id: userId }, order: [['type', 'ASC']] });
  return docs.map(serialize);
}

async function uploadDocument(userId, type, { fileUrl, fileUrlBack, number }) {
  if (!REQUIRED_TYPES.includes(type)) throw badRequest('Invalid document type');

  const [doc] = await Document.findOrCreate({
    where: { user_id: userId, type },
    defaults: { user_id: userId, type },
  });
  if (fileUrl) doc.file_url = fileUrl;
  if (fileUrlBack) doc.file_url_back = fileUrlBack;
  if (number) doc.number_enc = encrypt(number); // store encrypted at rest
  doc.status = 'PENDING';
  doc.remarks = null;
  await doc.save();

  // If all required docs now exist, move the user to DOCS_SUBMITTED.
  const count = await Document.count({
    where: { user_id: userId, type: { [Op.in]: REQUIRED_TYPES } },
  });
  if (count >= REQUIRED_TYPES.length) {
    const user = await User.findByPk(userId);
    if (user && ['PENDING_VERIFY', 'DOCS_PENDING'].includes(user.status)) {
      user.status = 'DOCS_SUBMITTED';
      await user.save();
    }
  }
  return serialize(doc);
}

async function verifyDocument(documentId, verifierId, { status, remarks }) {
  if (!['VERIFIED', 'REJECTED'].includes(status)) throw badRequest('status must be VERIFIED or REJECTED');
  const doc = await Document.findByPk(documentId);
  if (!doc) throw notFound('Document not found');
  doc.status = status;
  doc.remarks = remarks || null;
  doc.verified_by = verifierId;
  doc.verified_at = new Date(); // audit: when the decision was made
  await doc.save();

  // Rejection: tell the employee what to fix so they can re-upload that one doc.
  if (status === 'REJECTED') {
    const reason = remarks ? ` Reason: ${remarks}.` : '';
    await Notification.create({
      user_id: doc.user_id,
      title: `Document rejected: ${doc.type}`,
      body: `Your ${doc.type} document was rejected.${reason} Please re-upload it for verification.`,
    });
    try {
      const owner = await User.findByPk(doc.user_id, { attributes: ['email'] });
      if (owner) {
        await sendMail({
          to: owner.email,
          subject: `Action needed: your ${doc.type} document`,
          text: `Your ${doc.type} document was rejected.${reason} Please log in and re-upload it.`,
          html: `<p>Your <b>${doc.type}</b> document was rejected.${reason}</p><p>Please log in and re-upload it for verification.</p>`,
        });
      }
    } catch (e) {
      logger.warn(`verifyDocument: rejection email failed for user ${doc.user_id}: ${e.message}`);
    }
  }

  // When all required docs are verified, activate the employee.
  const verifiedCount = await Document.count({
    where: { user_id: doc.user_id, type: { [Op.in]: REQUIRED_TYPES }, status: 'VERIFIED' },
  });
  let activation = null;
  if (verifiedCount >= REQUIRED_TYPES.length) {
    activation = await activateEmployee(doc.user_id, verifierId);
  }
  return { document: serialize(doc), activation };
}

async function activateEmployee(userId, verifierId) {
  const user = await User.findByPk(userId);
  if (!user || user.status === 'ACTIVE') return null;

  // Generate the next EMP#### code from the current maximum.
  const codes = await User.findAll({
    attributes: ['employee_code'],
    where: { employee_code: { [Op.ne]: null } },
  });
  const maxNum = codes
    .map((u) => parseInt(String(u.employee_code).replace(/[^0-9]/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  const employeeCode = nextEmployeeCode(maxNum ? `EMP${maxNum}` : null);

  await sequelize.transaction(async (tx) => {
    user.status = 'ACTIVE';
    user.employee_code = employeeCode;
    await user.save({ transaction: tx });

    // Seed annual leave balances.
    for (const [type, total] of Object.entries(LeaveBalance.DEFAULTS)) {
      // eslint-disable-next-line no-await-in-loop
      await LeaveBalance.findOrCreate({
        where: { user_id: userId, type },
        defaults: { user_id: userId, type, total, used: 0 },
        transaction: tx,
      });
    }

    await Notification.create(
      { user_id: userId, title: 'Welcome to TrueSkill!', body: `Your Employee ID is ${employeeCode}.` },
      { transaction: tx }
    );
  });

  // Best-effort: the employee is already ACTIVE (transaction committed above), so
  // a mail failure must NOT throw — otherwise the admin's verify request 500s even
  // though activation succeeded, and the screen can't reload.
  try {
    await sendMail({
      to: user.email,
      subject: 'Your TrueSkill Employee ID',
      text: `Your documents are verified. Your Employee ID is ${employeeCode}.`,
      html: `<p>Your documents have been verified.</p><p>Your Employee ID is <b>${employeeCode}</b>. You can now log in with it.</p>`,
    });
  } catch (e) {
    logger.warn(`activateEmployee: welcome email failed for ${user.email}: ${e.message}`);
  }
  logger.info(`Activated employee ${user.email} as ${employeeCode}`);
  return { employeeCode, status: 'ACTIVE' };
}

module.exports = { listDocuments, uploadDocument, verifyDocument, REQUIRED_TYPES };
