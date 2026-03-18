'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const { adminAuth } = require('./admin.middleware');
const { authLimiter } = require('../../middleware/rateLimiter');

// Auth routes (no auth required for login)
router.post('/auth/login', authLimiter, controller.login);
router.post('/auth/logout', controller.logout);
router.get('/auth/me', adminAuth, controller.getMe);

// Dashboard (requires auth)
router.get('/dashboard/stats', adminAuth, controller.getDashboardStats);

// Reservations (requires auth)
router.get('/reservations', adminAuth, controller.getReservations);
router.get('/reservations/:id', adminAuth, controller.getReservation);
router.patch('/reservations/:id', adminAuth, controller.updateReservation);

// Venues (requires auth)
router.get('/venues', adminAuth, controller.getVenues);
router.get('/venues/:id', adminAuth, controller.getVenue);
router.post('/venues', adminAuth, controller.createVenue);
router.patch('/venues/:id', adminAuth, controller.updateVenue);
router.delete('/venues/:id', adminAuth, controller.archiveVenue);

// Venue blocks (requires auth)
router.get('/venues/:id/blocks', adminAuth, controller.getVenueBlocks);
router.post('/venues/:id/blocks', adminAuth, controller.createVenueBlock);
router.delete('/blocks/:id', adminAuth, controller.deleteVenueBlock);

// Customers (requires auth)
router.get('/customers', adminAuth, controller.getCustomers);

module.exports = router;
