'use strict';

const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const logger = require('./utils/logger');

// Keep trying to connect to the DB without ever taking the whole process down.
// On shared MySQL the global connection cap can be transiently saturated by
// other tenants; we must NOT exit (that would 502 everything, incl. /health).
async function connectWithRetry(attempt = 1) {
  try {
    await connectDb();
  } catch (err) {
    const delayMs = Math.min(30000, 2000 * attempt); // backoff, capped at 30s
    logger.error(`DB connect attempt ${attempt} failed: ${err.message}. Retrying in ${delayMs}ms`);
    setTimeout(() => connectWithRetry(attempt + 1), delayMs);
  }
}

function start() {
  // Listen first so /health and the process stay up even if the DB is briefly
  // unreachable; the DB connection is established (and retried) in the background.
  app.listen(env.port, () => {
    logger.info(`TrueSkill HRMS API listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`Base URL: ${env.appBaseUrl}${env.apiPrefix}`);
  });
  connectWithRetry();
}

start();
