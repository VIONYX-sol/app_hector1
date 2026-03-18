'use strict';

const { query } = require('../config/database');

const tenantMiddleware = async (req, res, next) => {
  if (req.companyId) return next();

  const slug = req.headers['x-company-slug'] || req.query.company_slug;
  if (slug) {
    try {
      const result = await query(
        'SELECT id, name, slug, subscription_status, is_active FROM companies WHERE slug = $1',
        [slug]
      );
      if (result.rows.length) {
        const company = result.rows[0];
        if (!company.is_active) {
          return res.status(403).json({ error: 'Company account is inactive' });
        }
        req.company = {
          id: company.id,
          name: company.name,
          slug: company.slug,
          subscriptionStatus: company.subscription_status,
          isActive: company.is_active,
        };
        req.companyId = company.id;
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
};

const requireTenant = (req, res, next) => {
  if (!req.companyId) {
    return res.status(400).json({ error: 'Company context required' });
  }
  next();
};

const enforceTenantScope = (companyIdField = 'company_id') => async (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') return next();
  if (!req.companyId) {
    return res.status(400).json({ error: 'Company context required' });
  }
  next();
};

module.exports = { tenantMiddleware, requireTenant, enforceTenantScope };
