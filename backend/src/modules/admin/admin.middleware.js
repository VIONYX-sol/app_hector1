'use strict';

const authService = require('./admin-auth.service');
const logger = require('../../utils/logger');

const SESSION_COOKIE_NAME = 'admin_session';

/**
 * Middleware to authenticate admin users via session cookie
 */
async function adminAuth(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const admin = await authService.validateSession(sessionToken);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    logger.error('Admin auth error', { error: err.message });
    res.status(500).json({ error: 'Authentication error' });
  }
}

module.exports = { adminAuth };
