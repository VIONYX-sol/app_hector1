'use strict';

const publicService = require('./public.service');
const logger = require('../../utils/logger');
const Joi = require('joi');

// Validation schema for reservation creation
const reservationSchema = Joi.object({
  venue_id: Joi.string().uuid().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  full_name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(6).max(50).required(),
  company: Joi.string().max(255).allow(null, ''),
  event_type: Joi.string().max(100).required(),
  attendee_count: Joi.number().integer().min(1).max(10000).allow(null),
  notes: Joi.string().max(2000).allow(null, ''),
});

/**
 * GET /api/public/venues
 * List all active venues
 */
async function listVenues(req, res, next) {
  try {
    const venues = await publicService.getVenues();
    res.json(venues);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/venues/:slug
 * Get venue details by slug
 */
async function getVenue(req, res, next) {
  try {
    const { slug } = req.params;
    const venue = await publicService.getVenueBySlug(slug);
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/venues/:id/availability
 * Get venue availability (unavailable dates)
 */
async function getAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query params are required' });
    }

    // Validate date format
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const availability = await publicService.getVenueAvailability(id, from, to);
    res.json(availability);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/public/reservations
 * Create a new reservation request
 */
async function createReservation(req, res, next) {
  try {
    // Validate input
    const { error, value } = reservationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const reservation = await publicService.createReservation(value);
    
    res.status(201).json(reservation);
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = {
  listVenues,
  getVenue,
  getAvailability,
  createReservation,
};
