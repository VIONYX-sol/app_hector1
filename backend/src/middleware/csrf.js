'use strict';

/**
 * CSRF Protection Middleware
 * 
 * For cookie-based auth in a REST API, we use a custom header approach.
 * The frontend must send the X-Requested-With header on all mutation requests.
 * This header cannot be set by cross-origin requests without CORS permission.
 */

const CSRF_HEADER = 'x-requested-with';
const CSRF_HEADER_VALUE = 'XMLHttpRequest';

/**
 * CSRF protection middleware for routes that use cookie auth
 * Requires X-Requested-With header on non-GET requests
 */
function csrfProtection(req, res, next) {
  // Skip GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check for custom header
  const headerValue = req.headers[CSRF_HEADER];
  
  if (!headerValue || headerValue.toLowerCase() !== CSRF_HEADER_VALUE.toLowerCase()) {
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'Missing or invalid X-Requested-With header'
    });
  }

  next();
}

module.exports = { csrfProtection, CSRF_HEADER, CSRF_HEADER_VALUE };
