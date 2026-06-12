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
  return transporter.sendMail({ from: env.mail.from, to, subject, html, text });
}

module.exports = { sendMail };
