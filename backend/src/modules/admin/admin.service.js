'use strict';

const { query, transaction } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Get all reservations for admin view
 */
async function getReservations(filters = {}) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (filters.status) {
    whereClause += ` AND r.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.venue_id) {
    whereClause += ` AND r.venue_id = $${paramIndex}`;
    params.push(filters.venue_id);
    paramIndex++;
  }

  if (filters.customer_id) {
    whereClause += ` AND r.customer_id = $${paramIndex}`;
    params.push(filters.customer_id);
    paramIndex++;
  }

  if (filters.from_date) {
    whereClause += ` AND r.start_date >= $${paramIndex}::date`;
    params.push(filters.from_date);
    paramIndex++;
  }

  if (filters.to_date) {
    whereClause += ` AND r.end_date <= $${paramIndex}::date`;
    params.push(filters.to_date);
    paramIndex++;
  }

  const limit = Math.min(filters.limit || 100, 500);
  const offset = filters.offset || 0;

  const result = await query(`
    SELECT 
      r.id, r.public_reference, r.venue_id, r.customer_id,
      r.customer_name_snapshot, r.customer_email_snapshot, 
      r.customer_phone_snapshot, r.customer_company_snapshot,
      r.event_type, r.attendee_count, r.start_date, r.end_date,
      r.status, r.source, r.notes, r.internal_notes,
      r.created_at, r.updated_at,
      json_build_object('id', v.id, 'name', v.name, 'slug', v.slug) as venue
    FROM reservations r
    LEFT JOIN venues v ON v.id = r.venue_id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params);

  return result.rows;
}

/**
 * Get single reservation by ID
 */
async function getReservationById(id) {
  const result = await query(`
    SELECT 
      r.*,
      json_build_object('id', v.id, 'name', v.name, 'slug', v.slug) as venue,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', h.id,
          'old_status', h.old_status,
          'new_status', h.new_status,
          'note', h.note,
          'created_at', h.created_at
        ) ORDER BY h.created_at DESC)
        FROM reservation_status_history h WHERE h.reservation_id = r.id),
        '[]'
      ) as status_history
    FROM reservations r
    LEFT JOIN venues v ON v.id = r.venue_id
    WHERE r.id = $1
  `, [id]);

  return result.rows[0] || null;
}

/**
 * Update reservation (status, internal notes)
 */
async function updateReservation(id, data, adminId) {
  const { status, internal_notes } = data;

  // Get current reservation state
  const current = await query('SELECT status FROM reservations WHERE id = $1', [id]);
  if (current.rows.length === 0) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  const oldStatus = current.rows[0].status;

  // Build update query
  const updates = [];
  const params = [id];
  let paramIndex = 2;

  if (status && status !== oldStatus) {
    updates.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (internal_notes !== undefined) {
    updates.push(`internal_notes = $${paramIndex}`);
    params.push(internal_notes);
    paramIndex++;
  }

  if (updates.length === 0) {
    return getReservationById(id);
  }

  // Update reservation
  await query(
    `UPDATE reservations SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1`,
    params
  );

  // Record status change in history
  if (status && status !== oldStatus) {
    await query(
      `INSERT INTO reservation_status_history 
       (reservation_id, old_status, new_status, changed_by_admin_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, oldStatus, status, adminId, internal_notes || null]
    );

    logger.info('Reservation status updated', {
      reservationId: id,
      oldStatus,
      newStatus: status,
      adminId,
    });
  }

  return getReservationById(id);
}

/**
 * Get all venues for admin
 */
async function getVenues() {
  const result = await query(`
    SELECT 
      v.*,
      COALESCE(
        (SELECT json_agg(vi.image_url ORDER BY vi.sort_order)
         FROM venue_images vi WHERE vi.venue_id = v.id),
        '[]'
      ) as images,
      (SELECT COUNT(*) FROM reservations r WHERE r.venue_id = v.id) as reservation_count
    FROM venues v
    ORDER BY v.sort_order ASC, v.name ASC
  `);
  return result.rows;
}

/**
 * Get single venue by ID
 */
async function getVenueById(id) {
  const result = await query(`
    SELECT 
      v.*,
      COALESCE(
        (SELECT json_agg(vi.image_url ORDER BY vi.sort_order)
         FROM venue_images vi WHERE vi.venue_id = v.id),
        '[]'
      ) as images
    FROM venues v
    WHERE v.id = $1
  `, [id]);
  return result.rows[0] || null;
}

/**
 * Create a new venue
 */
async function createVenue(data) {
  const {
    slug, name, short_description, full_description,
    location_text, capacity, price_from, currency,
    is_active, sort_order, images
  } = data;

  // Check slug uniqueness
  const existing = await query('SELECT id FROM venues WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('Slug already exists'), { statusCode: 409 });
  }

  const result = await query(`
    INSERT INTO venues (slug, name, short_description, full_description,
      location_text, capacity, price_from, currency, is_active, sort_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    slug, name, short_description || null, full_description || null,
    location_text || null, capacity || null, price_from || null,
    currency || 'EUR', is_active !== false, sort_order || 0
  ]);

  const venue = result.rows[0];

  // Add images if provided
  if (images && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      await query(
        `INSERT INTO venue_images (venue_id, image_url, sort_order)
         VALUES ($1, $2, $3)`,
        [venue.id, images[i], i]
      );
    }
  }

  logger.info('Venue created', { venueId: venue.id, name: venue.name });
  return getVenueById(venue.id);
}

/**
 * Update a venue
 */
async function updateVenue(id, data) {
  const {
    slug, name, short_description, full_description,
    location_text, capacity, price_from, currency,
    is_active, sort_order, images
  } = data;

  // Check venue exists
  const existing = await query('SELECT id FROM venues WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw Object.assign(new Error('Venue not found'), { statusCode: 404 });
  }

  // Check slug uniqueness if changing
  if (slug) {
    const slugCheck = await query('SELECT id FROM venues WHERE slug = $1 AND id != $2', [slug, id]);
    if (slugCheck.rows.length > 0) {
      throw Object.assign(new Error('Slug already exists'), { statusCode: 409 });
    }
  }

  // Build update
  const updates = [];
  const params = [id];
  let paramIndex = 2;

  const addUpdate = (field, value) => {
    if (value !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  };

  addUpdate('slug', slug);
  addUpdate('name', name);
  addUpdate('short_description', short_description);
  addUpdate('full_description', full_description);
  addUpdate('location_text', location_text);
  addUpdate('capacity', capacity);
  addUpdate('price_from', price_from);
  addUpdate('currency', currency);
  addUpdate('is_active', is_active);
  addUpdate('sort_order', sort_order);

  if (updates.length > 0) {
    await query(
      `UPDATE venues SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1`,
      params
    );
  }

  // Update images if provided
  if (images !== undefined) {
    await query('DELETE FROM venue_images WHERE venue_id = $1', [id]);
    for (let i = 0; i < images.length; i++) {
      await query(
        `INSERT INTO venue_images (venue_id, image_url, sort_order)
         VALUES ($1, $2, $3)`,
        [id, images[i], i]
      );
    }
  }

  logger.info('Venue updated', { venueId: id });
  return getVenueById(id);
}

/**
 * Archive (soft delete) a venue
 */
async function archiveVenue(id) {
  const result = await query(
    'UPDATE venues SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw Object.assign(new Error('Venue not found'), { statusCode: 404 });
  }

  logger.info('Venue archived', { venueId: id });
  return { success: true };
}

/**
 * Get venue blocks
 */
async function getVenueBlocks(venueId) {
  const result = await query(`
    SELECT id, venue_id, start_date, end_date, reason, created_at
    FROM venue_blocks
    WHERE venue_id = $1
    ORDER BY start_date DESC
  `, [venueId]);
  return result.rows;
}

/**
 * Create a venue block
 */
async function createVenueBlock(venueId, data, adminId) {
  const { start_date, end_date, reason } = data;

  const result = await query(`
    INSERT INTO venue_blocks (venue_id, start_date, end_date, reason, created_by_admin_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [venueId, start_date, end_date, reason || null, adminId]);

  logger.info('Venue block created', { venueId, startDate: start_date, endDate: end_date });
  return result.rows[0];
}

/**
 * Delete a venue block
 */
async function deleteVenueBlock(blockId) {
  const result = await query(
    'DELETE FROM venue_blocks WHERE id = $1 RETURNING id',
    [blockId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Block not found'), { statusCode: 404 });
  }

  logger.info('Venue block deleted', { blockId });
  return { success: true };
}

/**
 * Get all customers
 */
async function getCustomers(filters = {}) {
  const limit = Math.min(filters.limit || 100, 500);
  const offset = filters.offset || 0;

  const result = await query(`
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM reservations r WHERE r.customer_id = c.id) as reservation_count
    FROM customers c
    ORDER BY c.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return result.rows;
}

/**
 * Get dashboard stats
 */
async function getDashboardStats() {
  const [venuesResult, reservationsResult, customersResult] = await Promise.all([
    query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM venues'),
    query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM reservations
    `),
    query('SELECT COUNT(*) as total FROM customers'),
  ]);

  return {
    venues: {
      total: parseInt(venuesResult.rows[0].total),
      active: parseInt(venuesResult.rows[0].active),
    },
    reservations: {
      total: parseInt(reservationsResult.rows[0].total),
      pending: parseInt(reservationsResult.rows[0].pending),
      confirmed: parseInt(reservationsResult.rows[0].confirmed),
      rejected: parseInt(reservationsResult.rows[0].rejected),
      cancelled: parseInt(reservationsResult.rows[0].cancelled),
    },
    customers: {
      total: parseInt(customersResult.rows[0].total),
    },
  };
}

module.exports = {
  getReservations,
  getReservationById,
  updateReservation,
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  archiveVenue,
  getVenueBlocks,
  createVenueBlock,
  deleteVenueBlock,
  getCustomers,
  getDashboardStats,
};
