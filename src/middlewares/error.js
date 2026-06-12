'use strict';

const { AppError } = require('../utils/errors');
const { fail } = require('../utils/response');
const logger = require('../utils/logger');

// 404 handler for unmatched routes.
function notFoundHandler(req, res) {
  return fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND');
}

// Centralized error handler.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return fail(res, err.status, err.message, err.details);
  }
  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return fail(res, 409, 'Resource already exists', err.errors?.map((e) => e.message));
  }
  if (err.name === 'SequelizeValidationError') {
    return fail(res, 422, 'Validation failed', err.errors?.map((e) => e.message));
  }
  logger.error('Unhandled error:', err.stack || err.message);
  return fail(res, 500, 'Internal server error', null);
}

module.exports = { notFoundHandler, errorHandler };
