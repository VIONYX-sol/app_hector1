'use strict';

const { query, transaction } = require('../../config/database');
const { hashPassword, verifyPassword, generateSecureToken, hashToken } = require('../../utils/crypto');
const logger = require('../../utils/logger');

const SESSION_DURATION_DAYS = 7;

/**
 * Admin login with email and password
 * Returns session token for cookie-based auth
 */
async function login(email, password, ipAddress, userAgent) {
  const result = await query(
    `SELECT id, email, username, password_hash, role, is_active
     FROM admin_users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  const admin = result.rows[0];
  
  if (!admin) {
    throw Object.assign(new Error('Credenciales incorrectas'), { statusCode: 401 });
  }

  if (!admin.is_active) {
    throw Object.assign(new Error('Cuenta desactivada'), { statusCode: 401 });
  }

  const isValid = await verifyPassword(password, admin.password_hash);
  if (!isValid) {
    throw Object.assign(new Error('Credenciales incorrectas'), { statusCode: 401 });
  }

  // Create session
  const sessionToken = generateSecureToken(32);
  const sessionTokenHash = hashToken(sessionToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await query(
    `INSERT INTO admin_sessions (admin_id, session_token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [admin.id, sessionTokenHash, expiresAt, ipAddress, userAgent]
  );

  // Update last login
  await query(
    'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
    [admin.id]
  );

  logger.info('Admin login', { adminId: admin.id, email: admin.email });

  return {
    sessionToken,
    expiresAt,
    user: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
    },
  };
}

/**
 * Validate session token and get admin user
 */
async function validateSession(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);

  const result = await query(`
    SELECT 
      s.id as session_id, s.expires_at,
      a.id, a.email, a.username, a.role, a.is_active
    FROM admin_sessions s
    JOIN admin_users a ON a.id = s.admin_id
    WHERE s.session_token_hash = $1 AND s.expires_at > NOW()
  `, [tokenHash]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  
  if (!row.is_active) {
    return null;
  }

  return {
    sessionId: row.session_id,
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
  };
}

/**
 * Logout - invalidate session
 */
async function logout(sessionToken) {
  if (!sessionToken) return;

  const tokenHash = hashToken(sessionToken);
  await query(
    'DELETE FROM admin_sessions WHERE session_token_hash = $1',
    [tokenHash]
  );

  logger.info('Admin logout');
}

/**
 * Create admin user (for setup/seeding)
 */
async function createAdmin(email, password, username = null, role = 'admin') {
  const passwordHash = await hashPassword(password);

  const result = await query(
    `INSERT INTO admin_users (email, username, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, username, role`,
    [email.toLowerCase().trim(), username, passwordHash, role]
  );

  if (result.rows.length === 0) {
    throw new Error('Admin with this email already exists');
  }

  logger.info('Admin user created', { email });
  return result.rows[0];
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions() {
  const result = await query(
    'DELETE FROM admin_sessions WHERE expires_at < NOW()'
  );
  
  if (result.rowCount > 0) {
    logger.info('Cleaned up expired sessions', { count: result.rowCount });
  }
}

module.exports = {
  login,
  validateSession,
  logout,
  createAdmin,
  cleanupExpiredSessions,
  SESSION_DURATION_DAYS,
};
