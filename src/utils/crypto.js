'use strict';

const crypto = require('crypto');
const env = require('../config/env');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // 96-bit IV recommended for GCM

function getKey() {
  const hex = env.encryptionKey;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    // Derive a 32-byte key from an arbitrary string so the app still runs in dev.
    return crypto.createHash('sha256').update(String(hex)).digest();
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM.
 * Returns a compact "iv:tag:ciphertext" base64 payload safe to store in a TEXT column.
 */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

/**
 * Decrypts a payload produced by encrypt(). Returns null on missing input.
 * Throws if the payload is malformed or authentication fails (tamper detection).
 */
function decrypt(payload) {
  if (payload === null || payload === undefined || payload === '') return null;
  const parts = String(payload).split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext payload');
  const [ivB64, tagB64, dataB64] = parts;
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

/** SHA-256 hash (hex) — used for storing lookup-able token hashes, not for passwords. */
function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

/** Cryptographically-random URL-safe token. */
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Cryptographically-random numeric OTP (default 6 digits), zero-padded. */
function randomOtp(digits = 6) {
  const max = 10 ** digits;
  return String(crypto.randomInt(0, max)).padStart(digits, '0');
}

module.exports = { encrypt, decrypt, sha256, randomToken, randomOtp };
