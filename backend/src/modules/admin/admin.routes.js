'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const { adminAuth } = require('./admin.middleware');
const { authLimiter } = require('../../middleware/rateLimiter');
const { csrfProtection } = require('../../middleware/csrf');

// Auth routes (no auth required for login, but CSRF check for POST)
router.post('/auth/login', authLimiter, csrfProtection, controller.login);
router.post('/auth/logout', csrfProtection, controller.logout);
router.get('/auth/me', adminAuth, controller.getMe);

// Dashboard (requires auth)
router.get('/dashboard/stats', adminAuth, controller.getDashboardStats);

// Reservations (requires auth + CSRF for mutations)
router.get('/reservations', adminAuth, controller.getReservations);
router.get('/reservations/:id', adminAuth, controller.getReservation);
router.patch('/reservations/:id', adminAuth, csrfProtection, controller.updateReservation);

// Venues (requires auth + CSRF for mutations)
router.get('/venues', adminAuth, controller.getVenues);
router.get('/venues/:id', adminAuth, controller.getVenue);
router.post('/venues', adminAuth, csrfProtection, controller.createVenue);
router.patch('/venues/:id', adminAuth, csrfProtection, controller.updateVenue);
router.delete('/venues/:id', adminAuth, csrfProtection, controller.archiveVenue);

// Venue blocks (requires auth + CSRF for mutations)
router.get('/venues/:id/blocks', adminAuth, controller.getVenueBlocks);
router.post('/venues/:id/blocks', adminAuth, csrfProtection, controller.createVenueBlock);
router.delete('/blocks/:id', adminAuth, csrfProtection, controller.deleteVenueBlock);

// Customers (requires auth)
router.get('/customers', adminAuth, controller.getCustomers);

module.exports = router;
