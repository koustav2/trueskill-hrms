'use strict';

/** Standard success envelope: { success, data, message }. */
function ok(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data, error: null });
}

function created(res, data = null, message = 'Created') {
  return ok(res, data, message, 201);
}

/** Standard error envelope: { success:false, error, message }. */
function fail(res, status = 400, message = 'Bad Request', error = null) {
  return res.status(status).json({ success: false, message, data: null, error });
}

module.exports = { ok, created, fail };
