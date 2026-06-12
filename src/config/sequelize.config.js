'use strict';

// Used by sequelize-cli (migrations/seeders). Reads the same env as the app.
require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trueskill_hrms',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
};

module.exports = {
  development: base,
  test: {
    ...base,
    dialect: process.env.DB_DIALECT || 'mysql',
  },
  production: {
    ...base,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined,
    },
  },
};
