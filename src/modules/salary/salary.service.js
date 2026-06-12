'use strict';

const { SalarySlip } = require('../../db/models');
const { encrypt, decrypt } = require('../../utils/crypto');
const { badRequest, notFound, forbidden } = require('../../utils/errors');

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function serialize(s) {
  return {
    id: s.id,
    month: s.month,
    monthName: MONTHS[s.month] || String(s.month),
    year: s.year,
    gross: Number(decrypt(s.gross_enc)),
    deductions: Number(decrypt(s.deductions_enc)),
    net: Number(decrypt(s.net_enc)),
    pdfUrl: s.pdf_url,
  };
}

async function listSlips(userId) {
  const slips = await SalarySlip.findAll({ where: { user_id: userId }, order: [['year', 'DESC'], ['month', 'DESC']] });
  return slips.map(serialize);
}

async function getSlip(userId, id, role) {
  const slip = await SalarySlip.findByPk(id);
  if (!slip) throw notFound('Salary slip not found');
  if (slip.user_id !== userId && role !== 'HR_ADMIN') throw forbidden();
  return serialize(slip);
}

// HR: create/issue a salary slip with encrypted amounts.
async function createSlip({ userId, month, year, gross, deductions }) {
  if (!userId || !month || !year) throw badRequest('userId, month and year are required');
  const net = Number(gross) - Number(deductions || 0);
  const slip = await SalarySlip.create({
    user_id: userId,
    month: Number(month),
    year: Number(year),
    gross_enc: encrypt(String(gross)),
    deductions_enc: encrypt(String(deductions || 0)),
    net_enc: encrypt(String(net)),
  });
  return serialize(slip);
}

module.exports = { listSlips, getSlip, createSlip };
