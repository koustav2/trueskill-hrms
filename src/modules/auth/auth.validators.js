'use strict';

const { body } = require('express-validator');

const registerRules = [
  body('fullName').trim().isLength({ min: 2, max: 120 }).withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).matches(/^[+0-9\- ]{7,20}$/).withMessage('Invalid phone'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const verifyEmailRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('otp').isString().isLength({ min: 4, max: 8 }).withMessage('Enter the code from your email'),
];

const resendOtpRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
];

const loginRules = [
  body('identifier').trim().notEmpty().withMessage('Employee ID or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshRules = [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'),
];

const logoutRules = [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'),
];

const changePasswordRules = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isString().notEmpty().withMessage('New password is required'),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').isString().notEmpty().withMessage('token is required'),
  body('newPassword').isString().notEmpty().withMessage('New password is required'),
];

module.exports = {
  registerRules,
  verifyEmailRules,
  resendOtpRules,
  loginRules,
  refreshRules,
  logoutRules,
  changePasswordRules,
  forgotPasswordRules,
  resetPasswordRules,
};
