'use strict';

const { Leave, LeaveBalance, Notification, sequelize } = require('../../db/models');
const { badRequest, notFound } = require('../../utils/errors');
const { toDateOnly } = require('../../utils/dates');

function serialize(l) {
  return {
    id: l.id,
    type: l.type,
    startDate: l.start_date,
    endDate: l.end_date,
    days: l.days,
    remarks: l.remarks,
    status: l.status,
  };
}

function dayCount(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : 1;
}

async function listLeaves(userId, status) {
  const where = { user_id: userId };
  if (status) where.status = status;
  const leaves = await Leave.findAll({ where, order: [['created_at', 'DESC']] });
  return leaves.map(serialize);
}

async function getBalance(userId) {
  const balances = await LeaveBalance.findAll({ where: { user_id: userId } });
  return balances.map((b) => ({ type: b.type, total: b.total, used: b.used, remaining: b.total - b.used }));
}

async function applyLeave(userId, { type, startDate, endDate, remarks }) {
  if (!['CL', 'SL', 'PL', 'ML'].includes(type)) throw badRequest('Invalid leave type');
  if (!startDate || !endDate) throw badRequest('startDate and endDate are required');
  const start = toDateOnly(startDate, 'startDate');
  const end = toDateOnly(endDate, 'endDate');
  const days = dayCount(start, end);

  const balance = await LeaveBalance.findOne({ where: { user_id: userId, type } });
  if (balance && balance.total - balance.used < days) {
    throw badRequest(`Insufficient ${type} balance (${balance.total - balance.used} days left)`);
  }

  const leave = await Leave.create({
    user_id: userId,
    type,
    start_date: start,
    end_date: end,
    days,
    remarks: remarks || null,
    status: 'APPLIED',
  });
  return serialize(leave);
}

async function decide(leaveId, approverId, { status, remarks }) {
  if (!['APPROVED', 'REJECTED'].includes(status)) throw badRequest('status must be APPROVED or REJECTED');
  const leave = await Leave.findByPk(leaveId);
  if (!leave) throw notFound('Leave not found');
  if (leave.status !== 'APPLIED') throw badRequest('Leave already decided');

  await sequelize.transaction(async (tx) => {
    leave.status = status;
    leave.approver_id = approverId;
    leave.decided_at = new Date();
    if (remarks) leave.remarks = remarks;
    await leave.save({ transaction: tx });

    if (status === 'APPROVED') {
      const balance = await LeaveBalance.findOne({ where: { user_id: leave.user_id, type: leave.type }, transaction: tx });
      if (balance) {
        balance.used += leave.days;
        await balance.save({ transaction: tx });
      }
    }

    await Notification.create(
      {
        user_id: leave.user_id,
        title: `Leave ${status.toLowerCase()}`,
        body: `Your ${leave.type} leave (${leave.start_date} - ${leave.end_date}) was ${status.toLowerCase()}.`,
      },
      { transaction: tx }
    );
  });

  return serialize(leave);
}

module.exports = { listLeaves, getBalance, applyLeave, decide };
