'use strict';

const { verifyToken } = require('../utils/crypto');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    const result = await query(
      `SELECT u.id, u.company_id, u.email, u.first_name, u.last_name,
              u.role, u.permissions, u.is_active, u.mfa_enabled,
              c.id as comp_id, c.name as comp_name, c.slug as comp_slug,
              c.subscription_status, c.is_active as comp_active
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      permissions: user.permissions || [],
      companyId: user.company_id,
    };

    if (user.comp_id) {
      req.company = {
        id: user.comp_id,
        name: user.comp_name,
        slug: user.comp_slug,
        subscriptionStatus: user.subscription_status,
        isActive: user.comp_active,
      };
      req.companyId = user.comp_id;
    }

    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role === 'superadmin') return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const hasPermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role === 'superadmin') return next();
  const perms = req.user.permissions || [];
  const hasWildcard = perms.includes('*');
  const hasExact = perms.includes(permission);
  const [resource] = permission.split('.');
  const hasResourceWildcard = perms.includes(`${resource}.*`);
  if (hasWildcard || hasExact || hasResourceWildcard) return next();
  return res.status(403).json({ error: 'Insufficient permissions' });
};

const requireOwnership = (getResourceOwnerId) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (['superadmin', 'admin', 'manager'].includes(req.user.role)) return next();
    const ownerId = await getResourceOwnerId(req);
    if (ownerId && ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, requireRole, hasPermission, requireOwnership, optionalAuth };
