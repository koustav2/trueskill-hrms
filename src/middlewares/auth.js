'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/errors');

/** Requires a valid Bearer access token; attaches req.user = { id, role, email }. */
function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Missing or malformed Authorization header'));
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (_err) {
    return next(unauthorized('Invalid or expired token'));
  }
}

module.exports = { authenticate };
