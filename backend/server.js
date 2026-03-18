'use strict';

require('dotenv').config();

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const logger = require('./src/utils/logger');
const { helmetConfig, corsMiddleware, hppMiddleware, mongoSanitizeMiddleware, xssMiddleware } = require('./src/middleware/security');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const { tenantMiddleware } = require('./src/middleware/tenant');

const authRoutes = require('./src/modules/auth/auth.routes');
const companiesRoutes = require('./src/modules/companies/companies.routes');
const usersRoutes = require('./src/modules/users/users.routes');
const roomsRoutes = require('./src/modules/rooms/rooms.routes');
const bookingsRoutes = require('./src/modules/bookings/bookings.routes');
const paymentsRoutes = require('./src/modules/payments/payments.routes');
const invoicesRoutes = require('./src/modules/invoices/invoices.routes');
const expensesRoutes = require('./src/modules/expenses/expenses.routes');
const crmRoutes = require('./src/modules/crm/crm.routes');
const documentsRoutes = require('./src/modules/documents/documents.routes');
const analyticsRoutes = require('./src/modules/analytics/analytics.routes');
const notificationsRoutes = require('./src/modules/notifications/notifications.routes');
const webhooksRoutes = require('./src/modules/webhooks/webhooks.routes');
const complianceRoutes = require('./src/modules/compliance/compliance.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(helmetConfig);
app.use(corsMiddleware);
app.use(hppMiddleware);

app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitizeMiddleware);
app.use(xssMiddleware);

app.use(compression());

app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req) => req.path === '/health',
}));

app.use('/api/', generalLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(tenantMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', api: 'v1' });
});

const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/companies`, companiesRoutes);
app.use(`${API}/users`, usersRoutes);
app.use(`${API}/rooms`, roomsRoutes);
app.use(`${API}/bookings`, bookingsRoutes);
app.use(`${API}/payments`, paymentsRoutes);
app.use(`${API}/invoices`, invoicesRoutes);
app.use(`${API}/expenses`, expensesRoutes);
app.use(`${API}/crm`, crmRoutes);
app.use(`${API}/documents`, documentsRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/webhooks`, webhooksRoutes);
app.use(`${API}/compliance`, complianceRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

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
