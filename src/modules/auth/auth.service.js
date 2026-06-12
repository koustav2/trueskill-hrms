'use strict';

const { Op } = require('sequelize');
const { User, EmailToken, EmployeeProfile, RefreshToken, sequelize } = require('../../db/models');
const { hashPassword, comparePassword, validatePolicy } = require('../../utils/password');
const { issueTokens, verifyRefreshToken } = require('../../utils/jwt');
const { randomToken, randomOtp, sha256 } = require('../../utils/crypto');
const { badRequest, unauthorized, notFound, conflict } = require('../../utils/errors');
const { sendMail } = require('../../config/mailer');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const VERIFY_TTL_MS = 10 * 60 * 1000; // 10 min (OTP)
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

async function issueEmailToken(userId, purpose, ttlMs) {
  const raw = randomToken(32);
  await EmailToken.create({
    user_id: userId,
    token_hash: sha256(raw),
    purpose,
    expires_at: new Date(Date.now() + ttlMs),
  });
  return raw;
}

// Issues a numeric OTP for a user+purpose, invalidating any earlier unused codes.
async function issueOtp(userId, purpose, ttlMs) {
  await EmailToken.update(
    { used_at: new Date() },
    { where: { user_id: userId, purpose, used_at: { [Op.is]: null } } }
  );
  const otp = randomOtp(6);
  await EmailToken.create({
    user_id: userId,
    token_hash: sha256(otp),
    purpose,
    expires_at: new Date(Date.now() + ttlMs),
  });
  return otp;
}

async function sendVerifyOtp(user) {
  const otp = await issueOtp(user.id, 'VERIFY', VERIFY_TTL_MS);
  await sendMail({
    to: user.email,
    subject: 'Your TrueSkill HRMS verification code',
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Welcome to <b>TrueSkill HRMS</b>!</p><p>Your verification code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>It expires in 10 minutes.</p>`,
  });
  logger.info(`Verification OTP for ${user.email}: ${otp}`);
}

async function consumeEmailToken(rawToken, purpose) {
  const record = await EmailToken.findOne({
    where: {
      token_hash: sha256(rawToken),
      purpose,
      used_at: { [Op.is]: null },
      expires_at: { [Op.gt]: new Date() },
    },
  });
  if (!record) throw badRequest('Invalid or expired token');
  record.used_at = new Date();
  await record.save();
  return record;
}

// ── Refresh-token store (rotation + revocation) ─────────

// Issues access+refresh tokens for a user AND persists the refresh token's hash
// so it can later be rotated or revoked.
async function issueAndStore(user, transaction) {
  const tokens = issueTokens(user);
  const decoded = verifyRefreshToken(tokens.refreshToken);
  await RefreshToken.create(
    {
      user_id: user.id,
      token_hash: sha256(tokens.refreshToken),
      expires_at: new Date(decoded.exp * 1000),
    },
    transaction ? { transaction } : undefined
  );
  return tokens;
}

// Revokes every active refresh token for a user (logout-everywhere / theft response).
async function revokeAllForUser(userId, transaction) {
  await RefreshToken.update(
    { revoked_at: new Date() },
    {
      where: { user_id: userId, revoked_at: { [Op.is]: null } },
      ...(transaction ? { transaction } : {}),
    }
  );
}

// ── Public service methods ──────────────────────────────

async function register({ fullName, email, phone, password }) {
  const policy = validatePolicy(password);
  if (!policy.valid) throw badRequest('Password does not meet policy', policy.errors);

  const existing = await User.findOne({ where: { email } });
  if (existing) throw conflict('An account with this email already exists');

  const result = await sequelize.transaction(async (t) => {
    const user = await User.create(
      {
        email,
        phone,
        password_hash: await hashPassword(password),
        role: 'EMPLOYEE',
        status: 'PENDING_VERIFY',
      },
      { transaction: t }
    );
    await EmployeeProfile.create({ user_id: user.id, full_name: fullName }, { transaction: t });
    return user;
  });

  // OTP email is best-effort: the user is already created+committed above, so a
  // mail failure must NOT fail registration (it would 500 and leave a half-made
  // account that blocks retries with "email already exists"). OTP is disabled in
  // the current app flow anyway.
  try {
    await sendVerifyOtp(result);
  } catch (e) {
    logger.warn(`register: verify OTP email failed for ${email}: ${e.message}`);
  }
  return { id: result.id, email: result.email, status: result.status };
}

async function verifyEmail({ email, otp }) {
  if (!email || !otp) throw badRequest('Email and OTP are required');
  const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (!user) throw badRequest('Invalid or expired code');

  const record = await EmailToken.findOne({
    where: {
      user_id: user.id,
      token_hash: sha256(String(otp).trim()),
      purpose: 'VERIFY',
      used_at: { [Op.is]: null },
      expires_at: { [Op.gt]: new Date() },
    },
  });
  if (!record) throw badRequest('Invalid or expired code');

  record.used_at = new Date();
  await record.save();
  if (user.status === 'PENDING_VERIFY') user.status = 'DOCS_PENDING';
  user.email_verified_at = new Date();
  user.last_login_at = new Date();
  await user.save();

  // Auto-login on successful verification so the app can go straight to document upload.
  const tokens = await issueAndStore(user);
  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      employeeCode: user.employee_code,
    },
  };
}

async function resendOtp(email) {
  const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
  // Behave the same regardless, to avoid leaking which emails exist.
  if (user && !user.email_verified_at) await sendVerifyOtp(user);
  return { sent: true };
}

async function login({ identifier, password }) {
  // identifier can be employee_code (EMP1001) or email.
  const where = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { employee_code: identifier.toUpperCase() };

  const user = await User.scope('withSecret').findOne({ where });
  if (!user) throw unauthorized('Invalid credentials');

  const match = await comparePassword(password, user.password_hash);
  if (!match) throw unauthorized('Invalid credentials');

  if (user.status === 'REJECTED') throw unauthorized('Account access denied');

  user.last_login_at = new Date();
  await user.save();

  const tokens = await issueAndStore(user);
  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      employeeCode: user.employee_code,
    },
  };
}

// Rotates the refresh token: the presented token is revoked and a fresh pair is
// issued. Re-using an already-revoked token is treated as theft and revokes the
// whole token family for that user.
async function refresh(refreshToken) {
  if (!refreshToken) throw unauthorized('Missing refresh token');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_e) {
    throw unauthorized('Invalid refresh token');
  }

  const hash = sha256(refreshToken);
  const stored = await RefreshToken.findOne({ where: { token_hash: hash } });
  if (!stored) throw unauthorized('Invalid refresh token');

  if (stored.revoked_at) {
    // Reuse of a rotated/revoked token → assume compromise, kill all sessions.
    await revokeAllForUser(stored.user_id);
    throw unauthorized('Refresh token reuse detected. Please sign in again.');
  }
  if (stored.expires_at.getTime() < Date.now()) throw unauthorized('Refresh token expired');

  const user = await User.findByPk(payload.sub);
  if (!user) throw unauthorized('Invalid refresh token');

  const tokens = issueTokens(user);
  const newHash = sha256(tokens.refreshToken);
  const decoded = verifyRefreshToken(tokens.refreshToken);
  await sequelize.transaction(async (t) => {
    stored.revoked_at = new Date();
    stored.replaced_by_hash = newHash;
    await stored.save({ transaction: t });
    await RefreshToken.create(
      { user_id: user.id, token_hash: newHash, expires_at: new Date(decoded.exp * 1000) },
      { transaction: t }
    );
  });
  return tokens;
}

// Revokes the presented refresh token (single-device logout). Idempotent.
async function logout(refreshToken) {
  if (refreshToken) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { token_hash: sha256(refreshToken), revoked_at: { [Op.is]: null } } }
    );
  }
  return { loggedOut: true };
}

// Revokes every active session for the user (logout from all devices).
async function logoutAll(userId) {
  await revokeAllForUser(userId);
  return { loggedOut: true };
}

async function changePassword(userId, { oldPassword, newPassword }) {
  const policy = validatePolicy(newPassword);
  if (!policy.valid) throw badRequest('Password does not meet policy', policy.errors);

  const user = await User.scope('withSecret').findByPk(userId);
  if (!user) throw notFound('User not found');

  const match = await comparePassword(oldPassword, user.password_hash);
  if (!match) throw badRequest('Old password is incorrect');

  user.password_hash = await hashPassword(newPassword);
  await user.save();
  // Invalidate all existing sessions after a password change.
  await revokeAllForUser(user.id);
  return { changed: true };
}

async function forgotPassword(email) {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  // Always behave the same to avoid leaking which emails exist.
  if (user) {
    const rawToken = await issueEmailToken(user.id, 'RESET', RESET_TTL_MS);
    const link = `${env.webVerifyUrl.replace('verify-email', 'reset-password')}?token=${rawToken}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your TrueSkill HRMS password',
      text: `Reset your password: ${link}`,
      html: `<p>Reset your TrueSkill HRMS password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
    });
    logger.info(`Password reset link for ${email}: ${link}`);
  }
  return { sent: true };
}

async function resetPassword({ token, newPassword }) {
  const policy = validatePolicy(newPassword);
  if (!policy.valid) throw badRequest('Password does not meet policy', policy.errors);

  const record = await consumeEmailToken(token, 'RESET');
  const user = await User.scope('withSecret').findByPk(record.user_id);
  if (!user) throw notFound('User not found');
  user.password_hash = await hashPassword(newPassword);
  await user.save();
  // A reset means the account may have been compromised — kill all sessions.
  await revokeAllForUser(user.id);
  return { reset: true };
}

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  logoutAll,
  changePassword,
  forgotPassword,
  resetPassword,
};
