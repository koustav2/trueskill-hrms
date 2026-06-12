'use strict';

const { badRequest } = require('./errors');

/**
 * Normalizes an incoming date value to a clean 'YYYY-MM-DD' string for DATEONLY
 * columns. Returns null for empty input. Throws a 400 for an unparseable date.
 * This avoids Sequelize/moment crashing on malformed date strings.
 */
function toDateOnly(value, field = 'date') {
  if (value === undefined || value === null || value === '') return null;

  // Clean date-only string: validate it's a REAL calendar date (reject 2025-02-30 etc.)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const s = value.trim();
    const [y, m, day] = s.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1, day));
    const valid =
      d.getUTCFullYear() === y && d.getUTCMonth() === m - 1 && d.getUTCDate() === day;
    if (!valid) throw badRequest(`Invalid ${field}`);
    return s;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw badRequest(`Invalid ${field}`);
  return d.toISOString().slice(0, 10);
}

module.exports = { toDateOnly };
