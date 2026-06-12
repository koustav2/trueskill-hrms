'use strict';

const router = require('express').Router();
const controller = require('./auth.controller');
const rules = require('./auth.validators');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimit');

router.post('/register', authLimiter, validate(rules.registerRules), controller.register);
router.post('/verify-email', authLimiter, validate(rules.verifyEmailRules), controller.verifyEmail);
router.post('/resend-otp', authLimiter, validate(rules.resendOtpRules), controller.resendOtp);
router.post('/login', authLimiter, validate(rules.loginRules), controller.login);
router.post('/refresh', validate(rules.refreshRules), controller.refresh);
router.post('/logout', validate(rules.logoutRules), controller.logout);
router.post('/logout-all', authenticate, controller.logoutAll);
router.post('/forgot-password', authLimiter, validate(rules.forgotPasswordRules), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(rules.resetPasswordRules), controller.resetPassword);
router.post('/change-password', authenticate, validate(rules.changePasswordRules), controller.changePassword);

module.exports = router;
