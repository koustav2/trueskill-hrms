'use strict';

const { User } = require('../db/models');
const { forbidden } = require('../utils/errors');

/**
 * Server-side enforcement of the onboarding gate: an EMPLOYEE may only use the
 * working features (attendance, leave, tours, advances, tasks, salary) once HR
 * has verified their documents and the account is ACTIVE. This is the real
 * security boundary — the app's "pending" screen is only the UX for it.
 *
 * Looks up the live status (cheap PK lookup) so a rejection/suspension takes
 * effect immediately rather than waiting for the access token to expire.
 * HR_ADMIN bypasses (admins have their own routes).
 */
function requireActive(req, _res, next) {
  if (req.user && req.user.role === 'HR_ADMIN') return next();
  User.findByPk(req.user.id, { attributes: ['id', 'status'] })
    .then((user) => {
      if (!user) return next(forbidden('Account not found'));
      if (user.status !== 'ACTIVE') {
        return next(
          forbidden('Your account is pending HR verification', { status: user.status })
        );
      }
      return next();
    })
    .catch(next);
}

module.exports = { requireActive };
