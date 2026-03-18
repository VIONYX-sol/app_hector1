'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./public.controller');
const { generalLimiter } = require('../../middleware/rateLimiter');

// Public venue endpoints
router.get('/venues', controller.listVenues);
router.get('/venues/:slug', controller.getVenue);
router.get('/venues/:id/availability', controller.getAvailability);

// Public reservation creation (with rate limiting)
router.post('/reservations', generalLimiter, controller.createReservation);

module.exports = router;
