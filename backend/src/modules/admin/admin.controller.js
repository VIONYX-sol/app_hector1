'use strict';

const authService = require('./admin-auth.service');
const adminService = require('./admin.service');
const logger = require('../../utils/logger');
const Joi = require('joi');

const SESSION_COOKIE_NAME = 'admin_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: authService.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
};

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const venueSchema = Joi.object({
  slug: Joi.string().min(2).max(255).pattern(/^[a-z0-9-]+$/),
  name: Joi.string().min(2).max(255).required(),
  short_description: Joi.string().max(500).allow(null, ''),
  full_description: Joi.string().max(5000).allow(null, ''),
  location_text: Joi.string().max(255).allow(null, ''),
  capacity: Joi.number().integer().min(1).max(100000).allow(null),
  price_from: Joi.number().min(0).allow(null),
  currency: Joi.string().length(3).default('EUR'),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().default(0),
  images: Joi.array().items(Joi.string().uri()).default([]),
});

const blockSchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  reason: Joi.string().max(500).allow(null, ''),
});

const reservationUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'rejected', 'cancelled'),
  internal_notes: Joi.string().max(2000).allow(null, ''),
});

// ==========================================
// AUTH CONTROLLERS
// ==========================================

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(value.email, value.password, ipAddress, userAgent);

    // Set session cookie
    res.cookie(SESSION_COOKIE_NAME, result.sessionToken, COOKIE_OPTIONS);

    res.json({ user: result.user });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    await authService.logout(sessionToken);
    res.clearCookie(SESSION_COOKIE_NAME, COOKIE_OPTIONS);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json(req.admin);
}

// ==========================================
// RESERVATION CONTROLLERS
// ==========================================

async function getReservations(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      venue_id: req.query.venue_id,
      customer_id: req.query.customer_id,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
    };

    const reservations = await adminService.getReservations(filters);
    res.json(reservations);
  } catch (err) {
    next(err);
  }
}

async function getReservation(req, res, next) {
  try {
    const reservation = await adminService.getReservationById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}

async function updateReservation(req, res, next) {
  try {
    const { error, value } = reservationUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const reservation = await adminService.updateReservation(
      req.params.id, 
      value, 
      req.admin.id
    );
    res.json(reservation);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

// ==========================================
// VENUE CONTROLLERS
// ==========================================

async function getVenues(req, res, next) {
  try {
    const venues = await adminService.getVenues();
    res.json(venues);
  } catch (err) {
    next(err);
  }
}

async function getVenue(req, res, next) {
  try {
    const venue = await adminService.getVenueById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json(venue);
  } catch (err) {
    next(err);
  }
}

async function createVenue(req, res, next) {
  try {
    const { error, value } = venueSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const venue = await adminService.createVenue(value);
    res.status(201).json(venue);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

async function updateVenue(req, res, next) {
  try {
    const { error, value } = venueSchema.validate(req.body, { presence: 'optional' });
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const venue = await adminService.updateVenue(req.params.id, value);
    res.json(venue);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

async function archiveVenue(req, res, next) {
  try {
    await adminService.archiveVenue(req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

// ==========================================
// VENUE BLOCKS CONTROLLERS
// ==========================================

async function getVenueBlocks(req, res, next) {
  try {
    const blocks = await adminService.getVenueBlocks(req.params.id);
    res.json(blocks);
  } catch (err) {
    next(err);
  }
}

async function createVenueBlock(req, res, next) {
  try {
    const { error, value } = blockSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const block = await adminService.createVenueBlock(req.params.id, value, req.admin.id);
    res.status(201).json(block);
  } catch (err) {
    next(err);
  }
}

async function deleteVenueBlock(req, res, next) {
  try {
    await adminService.deleteVenueBlock(req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

// ==========================================
// CUSTOMER CONTROLLERS
// ==========================================

async function getCustomers(req, res, next) {
  try {
    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
    };

    const customers = await adminService.getCustomers(filters);
    res.json(customers);
  } catch (err) {
    next(err);
  }
}

// ==========================================
// DASHBOARD CONTROLLERS
// ==========================================

async function getDashboardStats(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Auth
  login,
  logout,
  getMe,
  // Reservations
  getReservations,
  getReservation,
  updateReservation,
  // Venues
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  archiveVenue,
  // Blocks
  getVenueBlocks,
  createVenueBlock,
  deleteVenueBlock,
  // Customers
  getCustomers,
  // Dashboard
  getDashboardStats,
};
