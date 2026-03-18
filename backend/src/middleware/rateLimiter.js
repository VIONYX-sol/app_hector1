'use strict';

const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

const generalLimiter = rateLimit({
  windowMs,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded, please try again later.' },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait an hour before trying again.' },
});

module.exports = { generalLimiter, authLimiter, apiLimiter, strictLimiter };
