'use strict';

const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

/** Runs express-validator chains, then returns 422 with field errors if any. */
function validate(rules) {
  return async (req, res, next) => {
    await Promise.all(rules.map((rule) => rule.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return fail(res, 422, 'Validation failed', errors);
  };
}

module.exports = { validate };
