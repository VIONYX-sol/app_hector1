'use strict';
const { pool } = require('../../config/database');
const { hashPassword, verifyPassword, generateToken, generateSecureToken } = require('../../utils/crypto');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const logger = require('../../utils/logger');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, to, subject, html });
  } catch (err) {
    logger.error('Email send failed', { error: err.message, to });
  }
}

async function register({ email, password, firstName, lastName, companyName, companySlug }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM users WHERE email=$1 AND company_id IS NULL', [email]);
    if (existing.rows.length) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

    const companyResult = await client.query(
      `INSERT INTO companies(name, slug) VALUES($1,$2) RETURNING id`,
      [companyName || `${firstName} ${lastName}`, companySlug || email.split('@')[0] + '-' + Date.now()]
    );
    const companyId = companyResult.rows[0].id;
    const passwordHash = await hashPassword(password);
    const verificationToken = generateSecureToken(32);
    const userResult = await client.query(
      `INSERT INTO users(company_id,email,password_hash,first_name,last_name,role,email_verification_token,email_verification_expires)
       VALUES($1,$2,$3,$4,$5,'admin',$6,NOW()+INTERVAL '24 hours') RETURNING id,email,first_name,last_name,role`,
      [companyId, email, passwordHash, firstName, lastName, verificationToken]
    );
    await client.query('COMMIT');
    const user = userResult.rows[0];
    await sendEmail(email, 'Verify your email', `<p>Click <a href="${process.env.APP_URL}/verify-email/${verificationToken}">here</a> to verify.</p>`);
    return { user, companyId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function login({ email, password, companyId }) {
  const q = companyId
    ? 'SELECT * FROM users WHERE email=$1 AND company_id=$2 AND is_active=true'
    : 'SELECT * FROM users WHERE email=$1 AND is_active=true LIMIT 1';
  const params = companyId ? [email, companyId] : [email];
  const result = await pool.query(q, params);
  const user = result.rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }
  if (user.locked_until && user.locked_until > new Date()) {
    throw Object.assign(new Error('Account locked'), { statusCode: 423 });
  }
  await pool.query('UPDATE users SET last_login_at=NOW(),failed_login_attempts=0 WHERE id=$1', [user.id]);
  const accessToken = generateToken({ sub: user.id, companyId: user.company_id, role: user.role }, process.env.JWT_EXPIRES_IN || '15m');
  const refreshToken = generateSecureToken(64);
  const refreshHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
  await pool.query('UPDATE users SET refresh_token_hash=$1,refresh_token_expires=NOW()+INTERVAL \'7 days\' WHERE id=$1', [refreshHash, user.id]);
  return { accessToken, refreshToken, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role, mfaEnabled: user.mfa_enabled } };
}

async function refreshToken(token) {
  const hash = require('crypto').createHash('sha256').update(token).digest('hex');
  const result = await pool.query('SELECT * FROM users WHERE refresh_token_hash=$1 AND refresh_token_expires>NOW() AND is_active=true', [hash]);
  const user = result.rows[0];
  if (!user) throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  const accessToken = generateToken({ sub: user.id, companyId: user.company_id, role: user.role }, process.env.JWT_EXPIRES_IN || '15m');
  return { accessToken };
}

async function verifyEmail(token) {
  const result = await pool.query('SELECT id FROM users WHERE email_verification_token=$1 AND email_verification_expires>NOW()', [token]);
  if (!result.rows.length) throw Object.assign(new Error('Invalid or expired token'), { statusCode: 400 });
  await pool.query('UPDATE users SET email_verified=true,email_verification_token=NULL,email_verification_expires=NULL WHERE id=$1', [result.rows[0].id]);
  return { message: 'Email verified' };
}

async function forgotPassword(email) {
  const result = await pool.query('SELECT id FROM users WHERE email=$1 AND is_active=true LIMIT 1', [email]);
  if (!result.rows.length) return { message: 'If that email exists, a reset link has been sent' };
  const token = generateSecureToken(32);
  await pool.query('UPDATE users SET password_reset_token=$1,password_reset_expires=NOW()+INTERVAL \'1 hour\' WHERE id=$2', [token, result.rows[0].id]);
  await sendEmail(email, 'Reset your password', `<p>Reset link: <a href="${process.env.APP_URL}/reset-password/${token}">click here</a>. Expires in 1 hour.</p>`);
  return { message: 'If that email exists, a reset link has been sent' };
}

async function resetPassword(token, newPassword) {
  const result = await pool.query('SELECT id FROM users WHERE password_reset_token=$1 AND password_reset_expires>NOW()', [token]);
  if (!result.rows.length) throw Object.assign(new Error('Invalid or expired token'), { statusCode: 400 });
  const hash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash=$1,password_reset_token=NULL,password_reset_expires=NULL,refresh_token_hash=NULL WHERE id=$2', [hash, result.rows[0].id]);
  return { message: 'Password updated' };
}

async function enableMFA(userId) {
  const secret = speakeasy.generateSecret({ length: 20, name: 'VenueManager' });
  await pool.query('UPDATE users SET mfa_secret=$1 WHERE id=$2', [secret.base32, userId]);
  const qr = await qrcode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCode: qr };
}

async function verifyMFA(userId, token) {
  const result = await pool.query('SELECT mfa_secret FROM users WHERE id=$1', [userId]);
  if (!result.rows.length) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const valid = speakeasy.totp.verify({ secret: result.rows[0].mfa_secret, encoding: 'base32', token, window: 1 });
  if (!valid) throw Object.assign(new Error('Invalid MFA token'), { statusCode: 401 });
  await pool.query('UPDATE users SET mfa_enabled=true WHERE id=$1', [userId]);
  return { message: 'MFA enabled' };
}

async function disableMFA(userId, token) {
  const result = await pool.query('SELECT mfa_secret FROM users WHERE id=$1', [userId]);
  if (!result.rows.length) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const valid = speakeasy.totp.verify({ secret: result.rows[0].mfa_secret, encoding: 'base32', token, window: 1 });
  if (!valid) throw Object.assign(new Error('Invalid MFA token'), { statusCode: 401 });
  await pool.query('UPDATE users SET mfa_enabled=false,mfa_secret=NULL WHERE id=$1', [userId]);
  return { message: 'MFA disabled' };
}

module.exports = { register, login, refreshToken, verifyEmail, forgotPassword, resetPassword, enableMFA, verifyMFA, disableMFA };
