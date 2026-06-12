'use strict';

// App/routing tests that don't touch the database: health, validation, auth guard, 404.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const request = require('supertest');
const app = require('../src/app');

const PREFIX = '/api/v1';

describe('App routing (no DB)', () => {
  test('GET /health → 200', async () => {
    const res = await request(app).get(`${PREFIX}/health`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('up');
  });

  test('register with invalid body → 422', async () => {
    const res = await request(app).post(`${PREFIX}/auth/register`).send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.error)).toBe(true);
  });

  test('login with missing fields → 422', async () => {
    const res = await request(app).post(`${PREFIX}/auth/login`).send({});
    expect(res.status).toBe(422);
  });

  test('GET /me without token → 401', async () => {
    const res = await request(app).get(`${PREFIX}/me`);
    expect(res.status).toBe(401);
  });

  test('GET /me with malformed token → 401', async () => {
    const res = await request(app).get(`${PREFIX}/me`).set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  test('unknown route → 404 envelope', async () => {
    const res = await request(app).get(`${PREFIX}/does-not-exist`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
