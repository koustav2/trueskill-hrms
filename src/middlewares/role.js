'use strict';

const { forbidden } = require('../utils/errors');

/** Restricts a route to one or more roles. Usage: requireRole('HR_ADMIN'). */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden('Insufficient permissions'));
    }
    return next();
  };
}

module.exports = { requireRole };
