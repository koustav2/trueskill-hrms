'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

// Matches the "Password must contain" rules on the Change Password screen.
const POLICY = {
  minLength: 8,
  upper: /[A-Z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

/** Returns { valid, errors[] } for the given password against the policy. */
function validatePolicy(password) {
  const errors = [];
  if (!password || password.length < POLICY.minLength) {
    errors.push(`At least ${POLICY.minLength} characters`);
  }
  if (!POLICY.upper.test(password || '')) errors.push('One uppercase letter');
  if (!POLICY.number.test(password || '')) errors.push('One number');
  if (!POLICY.special.test(password || '')) errors.push('One special character');
  return { valid: errors.length === 0, errors };
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { validatePolicy, hashPassword, comparePassword, POLICY };
