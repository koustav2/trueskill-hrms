'use strict';

const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const logger = require('./utils/logger');

async function start() {
  try {
    await connectDb();
    app.listen(env.port, () => {
      logger.info(`TrueSkill HRMS API listening on port ${env.port} (${env.nodeEnv})`);
      logger.info(`Base URL: ${env.appBaseUrl}${env.apiPrefix}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
