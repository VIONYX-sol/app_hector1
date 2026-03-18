'use strict';

const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Slug'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
  maxAge: 86400,
};

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

const sanitizeXSS = (obj) => {
  if (typeof obj === 'string') return xss(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeXSS);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [k, v] of Object.entries(obj)) {
      sanitized[k] = sanitizeXSS(v);
    }
    return sanitized;
  }
  return obj;
};

const xssMiddleware = (req, _res, next) => {
  if (req.body) req.body = sanitizeXSS(req.body);
  if (req.query) req.query = sanitizeXSS(req.query);
  next();
};

module.exports = {
  helmetConfig,
  corsMiddleware: cors(corsOptions),
  hppMiddleware: hpp(),
  mongoSanitizeMiddleware: mongoSanitize(),
  xssMiddleware,
};
