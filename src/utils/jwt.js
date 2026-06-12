'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessTtl });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshTtl });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/** Issues both tokens for a user record. */
function issueTokens(user) {
  // A unique `jti` per token guarantees every minted JWT is distinct even when
  // two are issued in the same second (otherwise identical sub/iat/exp would
  // produce byte-identical tokens → duplicate token_hash → UNIQUE violation on
  // rotation, e.g. login immediately followed by refresh).
  const claims = { sub: user.id, role: user.role, email: user.email };
  return {
    accessToken: signAccessToken({ ...claims, jti: crypto.randomUUID() }),
    refreshToken: signRefreshToken({ sub: user.id, jti: crypto.randomUUID() }),
    tokenType: 'Bearer',
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  issueTokens,
};
