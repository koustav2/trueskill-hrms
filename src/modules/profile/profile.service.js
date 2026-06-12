'use strict';

const { User, EmployeeProfile } = require('../../db/models');
const { notFound } = require('../../utils/errors');

function serialize(user, profile) {
  return {
    fullName: profile?.full_name || '',
    email: user.email,
    phone: user.phone,
    address: profile?.address || null,
    pincode: profile?.pincode || null,
    department: profile?.department || null,
    designation: profile?.designation || null,
    employeeCode: user.employee_code || null,
    avatarUrl: profile?.avatar_url || null,
    // Current account status (ACTIVE/DOCS_SUBMITTED/...) so the app can gate the
    // dashboard until HR has verified the documents.
    status: user.status,
  };
}

async function getProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw notFound('User not found');
  const profile = await EmployeeProfile.findOne({ where: { user_id: userId } });
  return serialize(user, profile);
}

async function updateProfile(userId, { fullName, phone, address, pincode }) {
  const user = await User.findByPk(userId);
  if (!user) throw notFound('User not found');

  if (phone !== undefined) {
    user.phone = phone;
    await user.save();
  }

  const [profile] = await EmployeeProfile.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, full_name: fullName || 'Employee' },
  });
  if (fullName !== undefined) profile.full_name = fullName;
  if (address !== undefined) profile.address = address;
  if (pincode !== undefined) profile.pincode = pincode;
  await profile.save();

  return serialize(user, profile);
}

async function setAvatar(userId, avatarUrl) {
  const [profile] = await EmployeeProfile.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, full_name: 'Employee' },
  });
  profile.avatar_url = avatarUrl;
  await profile.save();
  return { avatarUrl };
}

module.exports = { getProfile, updateProfile, setAvatar };
