'use strict';

require('dotenv').config();

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:4000',
  webVerifyUrl: process.env.WEB_VERIFY_URL || 'http://localhost:5173/verify-email',
  trustProxy: process.env.TRUST_PROXY === 'true',
  // CORS: comma-separated allowed origins, or '*' for any (dev default).
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  db: {
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'trueskill_hrms',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },

  // 32-byte key (hex). In dev a default is derived so the server still boots.
  encryptionKey: process.env.ENCRYPTION_KEY ||
    '0000000000000000000000000000000000000000000000000000000000000000',

  mail: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'TrueSkill HRMS <no-reply@trueskill.com>',
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@trueskill.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
  },
};

module.exports = env;
