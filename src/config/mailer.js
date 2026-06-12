'use strict';

const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('../utils/logger');

let transporter = null;

if (env.mail.host) {
  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
  });
}

/**
 * Sends an email. In dev (no SMTP_HOST configured) it logs to the console
 * so verification links are still visible without a mail server.
 */
async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    logger.info(`[MAIL:dev] To: ${to} | Subject: ${subject}`);
    if (text) logger.info(`[MAIL:dev] ${text}`);
    return { devLogged: true };
  }
  // Email is best-effort: a transient/misconfigured SMTP must never bubble up and
  // 500 the request that triggered it (registration, document verification, etc).
  // Failures are logged so they're visible without breaking the user flow.
  try {
    return await transporter.sendMail({ from: env.mail.from, to, subject, html, text });
  } catch (err) {
    logger.warn(`sendMail failed (to=${to}, subject="${subject}"): ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { sendMail };
