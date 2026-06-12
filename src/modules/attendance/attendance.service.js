'use strict';

const { Op } = require('sequelize');
const { Attendance } = require('../../db/models');
const { badRequest } = require('../../utils/errors');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function serialize(a) {
  return {
    id: a.id,
    date: a.date,
    checkIn: a.check_in,
    checkOut: a.check_out,
    totalMinutes: a.total_minutes,
    status: a.status,
    selfieUrl: a.selfie_url,
    checkInLat: a.check_in_lat != null ? Number(a.check_in_lat) : null,
    checkInLng: a.check_in_lng != null ? Number(a.check_in_lng) : null,
    checkOutLat: a.check_out_lat != null ? Number(a.check_out_lat) : null,
    checkOutLng: a.check_out_lng != null ? Number(a.check_out_lng) : null,
    checkInAddress: a.check_in_address || null,
    checkOutAddress: a.check_out_address || null,
  };
}

async function getToday(userId) {
  const record = await Attendance.findOne({ where: { user_id: userId, date: today() } });
  return record ? serialize(record) : { date: today(), checkIn: null, checkOut: null, totalMinutes: null, status: null };
}

async function checkIn(userId, selfieUrl, lat, lng, address) {
  // A live selfie is mandatory for check-in.
  if (!selfieUrl) throw badRequest('A selfie is required to check in');
  const [record, createdNew] = await Attendance.findOrCreate({
    where: { user_id: userId, date: today() },
    defaults: { user_id: userId, date: today(), status: 'PRESENT' },
  });
  if (!createdNew && record.check_in) throw badRequest('Already checked in today');
  record.check_in = new Date();
  record.status = 'PRESENT';
  record.selfie_url = selfieUrl;
  if (lat != null) record.check_in_lat = lat;
  if (lng != null) record.check_in_lng = lng;
  if (address) record.check_in_address = address;
  await record.save();
  return serialize(record);
}

async function checkOut(userId, lat, lng, address) {
  const record = await Attendance.findOne({ where: { user_id: userId, date: today() } });
  if (!record || !record.check_in) throw badRequest('You have not checked in today');
  if (record.check_out) throw badRequest('Already checked out today');
  record.check_out = new Date();
  record.total_minutes = Math.round((record.check_out - new Date(record.check_in)) / 60000);
  if (lat != null) record.check_out_lat = lat;
  if (lng != null) record.check_out_lng = lng;
  if (address) record.check_out_address = address;
  await record.save();
  return serialize(record);
}

async function history(userId, month, year) {
  const where = { user_id: userId };
  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${endDate}`;
    where.date = { [Op.between]: [start, end] };
  }
  const records = await Attendance.findAll({ where, order: [['date', 'DESC']] });
  return records.map(serialize);
}

module.exports = { getToday, checkIn, checkOut, history };
