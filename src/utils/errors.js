'use strict';

/** Application error with an HTTP status; thrown by services, handled centrally. */
class AppError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
    this.isOperational = true;
  }
}

const badRequest = (msg, details) => new AppError(400, msg, details);
const unauthorized = (msg = 'Unauthorized') => new AppError(401, msg);
const forbidden = (msg = 'Forbidden') => new AppError(403, msg);
const notFound = (msg = 'Not found') => new AppError(404, msg);
const conflict = (msg = 'Conflict') => new AppError(409, msg);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
