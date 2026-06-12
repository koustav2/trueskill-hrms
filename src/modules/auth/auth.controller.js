'use strict';

const service = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');

const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const data = await service.register({ fullName, email: email.toLowerCase(), phone, password });
  return created(res, data, 'Registered. Check your email to verify your account.');
});

const verifyEmail = asyncHandler(async (req, res) => {
  const data = await service.verifyEmail({ email: req.body.email, otp: req.body.otp });
  return ok(res, data, 'Email verified. You can now log in.');
});

const resendOtp = asyncHandler(async (req, res) => {
  const data = await service.resendOtp(req.body.email);
  return ok(res, data, 'If that account exists, a new code has been sent.');
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const data = await service.login({ identifier, password });
  return ok(res, data, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const data = await service.refresh(req.body.refreshToken);
  return ok(res, data, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const data = await service.logout(req.body.refreshToken);
  return ok(res, data, 'Logged out');
});

const logoutAll = asyncHandler(async (req, res) => {
  const data = await service.logoutAll(req.user.id);
  return ok(res, data, 'Logged out of all devices');
});

const changePassword = asyncHandler(async (req, res) => {
  const data = await service.changePassword(req.user.id, req.body);
  return ok(res, data, 'Password changed successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await service.forgotPassword(req.body.email);
  return ok(res, data, 'If that email exists, a reset link has been sent.');
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await service.resetPassword(req.body);
  return ok(res, data, 'Password reset successfully');
});

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
