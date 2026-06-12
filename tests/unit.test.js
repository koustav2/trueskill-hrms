'use strict';

// Pure-unit tests — no database required. Always run.
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { encrypt, decrypt, sha256, randomToken } = require('../src/utils/crypto');
const { validatePolicy, hashPassword, comparePassword } = require('../src/utils/password');
const { issueTokens, verifyAccessToken, verifyRefreshToken } = require('../src/utils/jwt');
const { nextEmployeeCode } = require('../src/utils/employeeId');

describe('crypto (AES-256-GCM)', () => {
  test('round-trips a sensitive value', () => {
    const v = 'ABCDE1234F';
    const enc = encrypt(v);
    expect(enc).not.toBe(v);
    expect(enc.split(':')).toHaveLength(3);
    expect(decrypt(enc)).toBe(v);
  });
  test('returns null for empty input', () => {
    expect(encrypt('')).toBeNull();
    expect(decrypt(null)).toBeNull();
  });
  test('tampered ciphertext fails authentication', () => {
    const enc = encrypt('sensitive');
    const tampered = enc.slice(0, -2) + (enc.endsWith('A') ? 'BB' : 'AA');
    expect(() => decrypt(tampered)).toThrow();
  });
  test('sha256 + randomToken are deterministic/unique', () => {
    expect(sha256('x')).toBe(sha256('x'));
    expect(randomToken()).not.toBe(randomToken());
  });
});

describe('password policy + hashing', () => {
  test('rejects weak passwords', () => {
    expect(validatePolicy('weak').valid).toBe(false);
    expect(validatePolicy('alllowercase1!').valid).toBe(false); // no uppercase
    expect(validatePolicy('NoSpecial123').valid).toBe(false);
  });
  test('accepts a compliant password', () => {
    expect(validatePolicy('Passw0rd@123').valid).toBe(true);
  });
  test('bcrypt hash verifies', async () => {
    const hash = await hashPassword('Passw0rd@123');
    expect(await comparePassword('Passw0rd@123', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});

describe('jwt', () => {
  test('issues and verifies access + refresh tokens', () => {
    const { accessToken, refreshToken } = issueTokens({ id: 'u1', role: 'EMPLOYEE', email: 'a@b.com' });
    expect(verifyAccessToken(accessToken).sub).toBe('u1');
    expect(verifyAccessToken(accessToken).role).toBe('EMPLOYEE');
    expect(verifyRefreshToken(refreshToken).sub).toBe('u1');
  });
});

describe('employee code generator', () => {
  test('starts at EMP1001 and increments', () => {
    expect(nextEmployeeCode(null)).toBe('EMP1001');
    expect(nextEmployeeCode('EMP1001')).toBe('EMP1002');
    expect(nextEmployeeCode('EMP1042')).toBe('EMP1043');
  });
});
