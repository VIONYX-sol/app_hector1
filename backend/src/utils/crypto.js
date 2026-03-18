'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'saas-venue',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'saas-venue',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { issuer: 'saas-venue' });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, { issuer: 'saas-venue' });
};

const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const encrypt = (text, key) => {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(16);
  const k = crypto.scryptSync(key, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', k, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  // Format: salt:iv:ciphertext (all hex)
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (encryptedText, key) => {
  const [saltHex, ivHex, encHex] = encryptedText.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const k = crypto.scryptSync(key, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', k, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  encrypt,
  decrypt,
};
