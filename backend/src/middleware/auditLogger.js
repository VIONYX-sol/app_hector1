'use strict';

const { query } = require('../config/database');
const logger = require('../utils/logger');

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const auditLogger = (resourceType) => async (req, res, next) => {
  if (!WRITE_METHODS.includes(req.method)) return next();

  const originalJson = res.json.bind(res);
  let responseBody;

  res.json = function (body) {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', async () => {
    try {
      const action = `${req.method}:${resourceType || req.path}`;
      const resourceId = req.params?.id || (responseBody?.data?.id) || null;
      const status = res.statusCode < 400 ? 'success' : 'failure';

      await query(
        `INSERT INTO audit_logs
          (company_id, user_id, action, resource_type, resource_id,
           new_values, ip_address, user_agent, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          req.companyId || null,
          req.user?.id || null,
          action,
          resourceType || null,
          resourceId,
          req.body ? JSON.stringify(req.body) : null,
          req.ip || req.connection?.remoteAddress,
          req.headers['user-agent'] || null,
          status,
          JSON.stringify({ path: req.path, method: req.method }),
        ]
      );
    } catch (err) {
      logger.error('Audit log error', { error: err.message });
    }
  });

  next();
};

module.exports = { auditLogger };
