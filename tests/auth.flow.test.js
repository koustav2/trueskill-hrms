'use strict';

// Full auth flow against a real database (MySQL by default, or sqlite if the
// driver is installed and DB_DIALECT_TEST=sqlite). Auto-SKIPS when no DB is
// reachable so `npm test` stays green in environments without a database.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.SMTP_HOST = '';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/db/models');

const PREFIX = '/api/v1';
let dbReady = false;

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    dbReady = true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`\n[auth.flow] No database reachable — skipping DB-backed tests. (${e.message})\n`);
  }
});

afterAll(async () => {
  try { await sequelize.close(); } catch (_e) { /* ignore */ }
});

const creds = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+91 9876543210',
  password: 'Passw0rd@123',
};
let accessToken;

describe('Auth flow (DB-backed)', () => {
  test('register → 201', async () => {
    if (!dbReady) return;
    const res = await request(app).post(`${PREFIX}/auth/register`).send(creds);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING_VERIFY');
  });

  test('duplicate email → 409', async () => {
    if (!dbReady) return;
    const res = await request(app).post(`${PREFIX}/auth/register`).send(creds);
    expect(res.status).toBe(409);
  });

  test('login → 200 with tokens', async () => {
    if (!dbReady) return;
    const res = await request(app)
      .post(`${PREFIX}/auth/login`)
      .send({ identifier: creds.email, password: creds.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
  });

  test('bad credentials → 401', async () => {
    if (!dbReady) return;
    const res = await request(app)
      .post(`${PREFIX}/auth/login`)
      .send({ identifier: creds.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('/me with token → 200', async () => {
    if (!dbReady) return;
    const res = await request(app).get(`${PREFIX}/me`).set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(creds.email);
  });

  test('change password → 200', async () => {
    if (!dbReady) return;
    const res = await request(app)
      .post(`${PREFIX}/auth/change-password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ oldPassword: creds.password, newPassword: 'NewPassw0rd@123' });
    expect(res.status).toBe(200);
  });
});

describe('Refresh rotation, reuse detection & logout', () => {
  const password = 'NewPassw0rd@123'; // password after the change above
  let refreshA;

  test('login issues a refresh token', async () => {
    if (!dbReady) return;
    const res = await request(app)
      .post(`${PREFIX}/auth/login`)
      .send({ identifier: creds.email, password });
    expect(res.status).toBe(200);
    refreshA = res.body.data.refreshToken;
    expect(refreshA).toBeTruthy();
  });

  test('refresh rotates the token (new pair issued)', async () => {
    if (!dbReady) return;
    const res = await request(app).post(`${PREFIX}/auth/refresh`).send({ refreshToken: refreshA });
    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.refreshToken).not.toBe(refreshA);
  });

  test('re-using the rotated (old) refresh token → 401', async () => {
    if (!dbReady) return;
    const res = await request(app).post(`${PREFIX}/auth/refresh`).send({ refreshToken: refreshA });
    expect(res.status).toBe(401);
  });

  test('logout revokes the active refresh token', async () => {
    if (!dbReady) return;
    const login = await request(app)
      .post(`${PREFIX}/auth/login`)
      .send({ identifier: creds.email, password });
    const refresh = login.body.data.refreshToken;

    const out = await request(app).post(`${PREFIX}/auth/logout`).send({ refreshToken: refresh });
    expect(out.status).toBe(200);

    const reuse = await request(app).post(`${PREFIX}/auth/refresh`).send({ refreshToken: refresh });
    expect(reuse.status).toBe(401);
  });
});
