'use strict';

require('dotenv').config();

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const logger = require('./src/utils/logger');
const { helmetConfig, corsMiddleware, hppMiddleware, xssMiddleware } = require('./src/middleware/security');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

// Import new route modules
const publicRoutes = require('./src/modules/public/public.routes');
const adminRoutes = require('./src/modules/admin/admin.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(corsMiddleware);
app.use(hppMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing for admin sessions
// CSRF protection is implemented via:
// 1. SameSite=Lax cookies (configured in admin.controller.js)
// 2. X-Requested-With header validation (via middleware/csrf.js)
// 3. CORS origin restrictions (via middleware/security.js)
// lgtm[js/missing-token-validation]
app.use(cookieParser());

// Security sanitization
app.use(xssMiddleware);

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req) => req.path === '/health' || req.path === '/api/health',
}));

// Rate limiting for API routes
app.use('/api/', generalLimiter);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const { pool } = require('./src/config/database');
      await pool.end();
      logger.info('Database connections closed');
    } catch (err) {
      logger.error('Error closing database', { error: err.message });
    }
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
