'use strict';

/**
 * Generates the next Employee Code in the EMP#### series (EMP1001, EMP1002, ...).
 * Called by HR after document verification. Takes the current highest code.
 */
const START = 1001;

function nextEmployeeCode(lastCode) {
  if (!lastCode) return `EMP${START}`;
  const n = parseInt(String(lastCode).replace(/[^0-9]/g, ''), 10);
  const next = Number.isNaN(n) ? START : n + 1;
  return `EMP${next}`;
}

module.exports = { nextEmployeeCode, START };
