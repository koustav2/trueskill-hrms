'use strict';

const { User, EmployeeProfile, Document, Leave, Tour, Advance, Attendance } = require('../../db/models');
const { decrypt } = require('../../utils/crypto');
const { notFound } = require('../../utils/errors');

const withEmployee = [{ model: User, as: 'user', include: [{ model: EmployeeProfile, as: 'profile' }] }];
const empName = (row) => row.user?.profile?.full_name || row.user?.email || 'Employee';

function employeeSummary(user) {
  const p = user.profile;
  return {
    id: user.id,
    employeeCode: user.employee_code,
    email: user.email,
    status: user.status,
    fullName: p?.full_name || null,
    department: p?.department || null,
    designation: p?.designation || null,
  };
}

async function listEmployees(status) {
  const where = { role: 'EMPLOYEE' };
  if (status) where.status = status;
  const users = await User.findAll({
    where,
    include: [{ model: EmployeeProfile, as: 'profile' }],
    order: [['created_at', 'DESC']],
  });
  return users.map(employeeSummary);
}

async function employeeDetail(userId) {
  const user = await User.findByPk(userId, { include: [{ model: EmployeeProfile, as: 'profile' }] });
  if (!user) throw notFound('Employee not found');
  const documents = await Document.findAll({ where: { user_id: userId }, order: [['type', 'ASC']] });
  const safeNumber = (enc) => {
    if (!enc) return null;
    try { return decrypt(enc); } catch (e) { return null; }
  };
  return {
    employee: employeeSummary(user),
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      fileUrl: d.file_url,
      fileUrlBack: d.file_url_back,
      number: safeNumber(d.number_enc),
      status: d.status,
      remarks: d.remarks,
    })),
  };
}

async function pendingLeaves(status = 'APPLIED') {
  const leaves = await Leave.findAll({
    where: { status },
    include: [{ model: User, as: 'user', include: [{ model: EmployeeProfile, as: 'profile' }] }],
    order: [['created_at', 'DESC']],
  });
  return leaves.map((l) => ({
    id: l.id,
    type: l.type,
    startDate: l.start_date,
    endDate: l.end_date,
    days: l.days,
    remarks: l.remarks,
    status: l.status,
    employeeName: l.user?.profile?.full_name || l.user?.email || 'Employee',
    employeeCode: l.user?.employee_code || null,
  }));
}

async function pendingTours(status = 'APPLIED') {
  const tours = await Tour.findAll({ where: { status }, include: withEmployee, order: [['created_at', 'DESC']] });
  return tours.map((t) => ({
    id: t.id,
    place: t.place,
    fromDate: t.from_date,
    toDate: t.to_date,
    purpose: t.purpose,
    status: t.status,
    employeeName: empName(t),
    employeeCode: t.user?.employee_code || null,
  }));
}

async function pendingAdvances(status = 'APPLIED') {
  const rows = await Advance.findAll({ where: { status }, include: withEmployee, order: [['created_at', 'DESC']] });
  return rows.map((a) => ({
    id: a.id,
    amount: Number(decrypt(a.amount_enc)),
    reason: a.reason,
    status: a.status,
    employeeName: empName(a),
    employeeCode: a.user?.employee_code || null,
  }));
}

async function attendanceRecords({ date, userId } = {}) {
  const where = {};
  if (date) where.date = date;
  if (userId) where.user_id = userId;
  const rows = await Attendance.findAll({
    where,
    include: withEmployee,
    order: [['date', 'DESC'], ['check_in', 'DESC']],
    limit: 1000,
  });
  return rows.map((a) => ({
    id: a.id,
    date: a.date,
    employeeName: empName(a),
    employeeCode: a.user?.employee_code || null,
    status: a.status,
    checkIn: a.check_in,
    checkOut: a.check_out,
    selfieUrl: a.selfie_url || null,
    checkInAddress: a.check_in_address || null,
    checkOutAddress: a.check_out_address || null,
    checkInLat: a.check_in_lat != null ? Number(a.check_in_lat) : null,
    checkInLng: a.check_in_lng != null ? Number(a.check_in_lng) : null,
    checkOutLat: a.check_out_lat != null ? Number(a.check_out_lat) : null,
    checkOutLng: a.check_out_lng != null ? Number(a.check_out_lng) : null,
  }));
}

async function counts() {
  const [pendingDocs, pendingLeavesCount, activeEmployees] = await Promise.all([
    Document.count({ where: { status: 'PENDING' } }),
    Leave.count({ where: { status: 'APPLIED' } }),
    User.count({ where: { role: 'EMPLOYEE', status: 'ACTIVE' } }),
  ]);
  return { pendingDocuments: pendingDocs, pendingLeaves: pendingLeavesCount, activeEmployees };
}

module.exports = { listEmployees, employeeDetail, pendingLeaves, pendingTours, pendingAdvances, attendanceRecords, counts };
