'use strict';

/**
 * Wipes all operational data while KEEPING HR_ADMIN accounts.
 *
 * Deletes: every non-admin user and all their owned rows (documents,
 * attendance, leaves, leave balances, salary slips, tasks, tours, advances,
 * notifications, email tokens, profiles) plus all company notices.
 *
 * Admin users (role = 'HR_ADMIN') and their own rows are preserved.
 *
 * Usage:
 *   cd backend
 *   node src/scripts/reset-data.js            # asks for confirmation
 *   node src/scripts/reset-data.js --yes      # skip the prompt
 */

const { Op } = require('sequelize');
const readline = require('readline');
const db = require('../db/models');

const {
  sequelize, User, EmailToken, EmployeeProfile, Document, Attendance,
  LeaveBalance, Leave, SalarySlip, Task, Tour, Advance, Notice, Notification,
} = db;

async function confirm() {
  if (process.argv.includes('--yes') || process.argv.includes('-y')) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('This deletes ALL non-admin data. Type "DELETE" to continue: ', (a) => {
      rl.close();
      resolve(a.trim() === 'DELETE');
    });
  });
}

async function run() {
  await sequelize.authenticate();

  const admins = await User.findAll({ where: { role: 'HR_ADMIN' }, attributes: ['id', 'email'] });
  const adminIds = admins.map((a) => a.id);
  console.log(`Keeping ${adminIds.length} admin account(s):`, admins.map((a) => a.email).join(', ') || '(none)');

  if (!(await confirm())) {
    console.log('Aborted. Nothing was deleted.');
    return;
  }

  // Only touch rows that do NOT belong to an admin.
  const notAdmin = adminIds.length ? { user_id: { [Op.notIn]: adminIds } } : {};

  await sequelize.transaction(async (tx) => {
    const opts = { where: notAdmin, transaction: tx };
    // Children first (works even if DB-level cascade isn't enabled).
    await Notification.destroy(opts);
    await Advance.destroy(opts);
    await Tour.destroy(opts);
    await Task.destroy(opts);
    await SalarySlip.destroy(opts);
    await Leave.destroy(opts);
    await LeaveBalance.destroy(opts);
    await Attendance.destroy(opts);
    await Document.destroy(opts);
    await EmployeeProfile.destroy(opts);
    await EmailToken.destroy(opts);

    // Company-wide notices (not user-owned) — clear all of them.
    await Notice.destroy({ where: {}, truncate: false, transaction: tx });

    // Finally the non-admin users themselves.
    const removed = await User.destroy({
      where: adminIds.length ? { id: { [Op.notIn]: adminIds } } : {},
      transaction: tx,
    });
    console.log(`Deleted ${removed} non-admin user(s) and all their data.`);
  });

  console.log('Done. Admin accounts and their data were preserved.');
}

run()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reset failed:', err.message);
    process.exit(1);
  });
