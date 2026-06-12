'use strict';

/** Wraps async route handlers so thrown errors reach the Express error middleware. */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
