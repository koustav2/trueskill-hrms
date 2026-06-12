'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

// Allow tests to run against an in-memory SQLite DB without a MySQL server.
const useSqliteForTest = env.isTest && process.env.DB_DIALECT_TEST === 'sqlite';

const sequelize = useSqliteForTest
  ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      dialect: env.db.dialect,
      logging: env.isProd ? false : (msg) => logger.debug(msg),
      // Shared MySQL hosts cap concurrent connections (BigRock is low). Keep the
      // pool tiny and release idle connections fast so a restart doesn't leave
      // sockets lingering on the server and trip "Too many connections".
      // Override with DB_POOL_MAX if your DB allows more.
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '3', 10),
        min: 0,
        acquire: 30000,
        idle: 5000,    // close a connection after 5s idle
        evict: 5000,   // sweep idle connections every 5s
      },
      // The shared host's GLOBAL max_connections (150) is regularly saturated by
      // other tenants, so a connection can be transiently refused even though our
      // own usage is tiny. Retry on those transient errors so users don't see 500s.
      retry: {
        max: 4,
        backoffBase: 300,
        backoffExponent: 1.4,
        match: [
          /Too many connections/,
          /ER_CON_COUNT_ERROR/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /PROTOCOL_CONNECTION_LOST/,
          /ECONNRESET/,
        ],
      },
    });

async function connectDb() {
  await sequelize.authenticate();
  logger.info(`Database connected (${sequelize.getDialect()})`);
}

module.exports = { sequelize, connectDb };
