'use strict';

const { query } = require('../../config/database');
const logger = require('../../utils/logger');
const mailService = require('../../services/mail.service');

/**
 * Get all active venues for public listing
 */
async function getVenues() {
  const result = await query(`
    SELECT 
      v.id, v.slug, v.name, v.short_description, v.location_text,
      v.capacity, v.price_from, v.currency, v.sort_order,
      COALESCE(
        (SELECT json_agg(vi.image_url ORDER BY vi.sort_order)
         FROM venue_images vi WHERE vi.venue_id = v.id),
        '[]'
      ) as images
    FROM venues v
    WHERE v.is_active = true
    ORDER BY v.sort_order ASC, v.name ASC
  `);
  return result.rows;
}

/**
 * Get venue by slug for public detail view
 */
async function getVenueBySlug(slug) {
  const result = await query(`
    SELECT 
      v.id, v.slug, v.name, v.short_description, v.full_description,
      v.location_text, v.capacity, v.price_from, v.currency,
      COALESCE(
        (SELECT json_agg(vi.image_url ORDER BY vi.sort_order)
         FROM venue_images vi WHERE vi.venue_id = v.id),
        '[]'
      ) as images,
      COALESCE(
        (SELECT json_agg(json_build_object('id', vf.id, 'name', vf.name, 'slug', vf.slug))
         FROM venue_feature_links vfl
         JOIN venue_features vf ON vf.id = vfl.feature_id
         WHERE vfl.venue_id = v.id),
        '[]'
      ) as features
    FROM venues v
    WHERE v.slug = $1 AND v.is_active = true
  `, [slug]);
  
  return result.rows[0] || null;
}

/**
 * Get unavailable dates for a venue within a date range
 * Returns dates that are blocked by:
 * - Pending reservations
 * - Confirmed reservations
 * - Owner blocks
 */
async function getVenueAvailability(venueId, fromDate, toDate) {
  // Get all blocking reservations (pending or confirmed)
  const reservationsResult = await query(`
    SELECT start_date, end_date
    FROM reservations
    WHERE venue_id = $1
      AND status IN ('pending', 'confirmed', 'owner_blocked')
      AND start_date <= $3::date
      AND end_date >= $2::date
  `, [venueId, fromDate, toDate]);

  // Get all venue blocks
  const blocksResult = await query(`
    SELECT start_date, end_date
    FROM venue_blocks
    WHERE venue_id = $1
      AND start_date <= $3::date
      AND end_date >= $2::date
  `, [venueId, fromDate, toDate]);

  // Collect all unavailable dates
  const unavailableDates = new Set();
  
  const addDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
      unavailableDates.add(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  };

  reservationsResult.rows.forEach(r => addDateRange(r.start_date, r.end_date));
  blocksResult.rows.forEach(b => addDateRange(b.start_date, b.end_date));

  return {
    venue_id: venueId,
    from: fromDate,
    to: toDate,
    unavailable_dates: Array.from(unavailableDates).sort(),
  };
}

/**
 * Check if dates overlap with existing bookings
 */
async function checkDateOverlap(venueId, startDate, endDate, excludeReservationId = null) {
  const params = [venueId, startDate, endDate];
  let excludeClause = '';
  
  if (excludeReservationId) {
    excludeClause = ' AND id != $4';
    params.push(excludeReservationId);
  }

  // Check reservations
  const reservationsResult = await query(`
    SELECT id FROM reservations
    WHERE venue_id = $1
      AND status IN ('pending', 'confirmed', 'owner_blocked')
      AND start_date <= $3::date
      AND end_date >= $2::date
      ${excludeClause}
    LIMIT 1
  `, params);

  if (reservationsResult.rows.length > 0) {
    return { hasOverlap: true, type: 'reservation' };
  }

  // Check venue blocks
  const blocksParams = [venueId, startDate, endDate];
  const blocksResult = await query(`
    SELECT id FROM venue_blocks
    WHERE venue_id = $1
      AND start_date <= $3::date
      AND end_date >= $2::date
    LIMIT 1
  `, blocksParams);

  if (blocksResult.rows.length > 0) {
    return { hasOverlap: true, type: 'block' };
  }

  return { hasOverlap: false };
}

/**
 * Create a new reservation
 */
async function createReservation(data) {
  const {
    venue_id,
    start_date,
    end_date,
    full_name,
    email,
    phone,
    company,
    event_type,
    attendee_count,
    notes,
  } = data;

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone?.replace(/\s+/g, '') || null;

  // Check for overlaps
  const overlapCheck = await checkDateOverlap(venue_id, start_date, end_date);
  if (overlapCheck.hasOverlap) {
    const error = new Error('Las fechas seleccionadas no están disponibles');
    error.statusCode = 409;
    throw error;
  }

  // Find or create customer
  let customerId = null;
  const existingCustomer = await query(
    'SELECT id FROM customers WHERE LOWER(email) = $1 LIMIT 1',
    [normalizedEmail]
  );

  if (existingCustomer.rows.length > 0) {
    customerId = existingCustomer.rows[0].id;
    // Update customer info
    await query(
      `UPDATE customers SET 
        full_name = $1, phone = COALESCE($2, phone), company = COALESCE($3, company),
        updated_at = NOW()
       WHERE id = $4`,
      [full_name, normalizedPhone, company, customerId]
    );
  } else {
    // Create new customer
    const newCustomer = await query(
      `INSERT INTO customers (full_name, email, phone, company)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [full_name, normalizedEmail, normalizedPhone, company]
    );
    customerId = newCustomer.rows[0].id;
  }

  // Create reservation
  const result = await query(`
    INSERT INTO reservations (
      venue_id, customer_id,
      customer_name_snapshot, customer_email_snapshot, customer_phone_snapshot, customer_company_snapshot,
      event_type, attendee_count, start_date, end_date, notes,
      status, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'public_web')
    RETURNING id, public_reference, status, created_at
  `, [
    venue_id, customerId,
    full_name, normalizedEmail, normalizedPhone, company,
    event_type, attendee_count, start_date, end_date, notes
  ]);

  const reservation = result.rows[0];

  // Get venue name for the response
  const venueResult = await query('SELECT name FROM venues WHERE id = $1', [venue_id]);
  const venueName = venueResult.rows[0]?.name || 'Unknown';

  logger.info('Reservation created', {
    reservationId: reservation.id,
    reference: reservation.public_reference,
    venue: venueName,
    email: normalizedEmail,
  });

  // Send notification emails (non-blocking)
  const notificationData = {
    id: reservation.id,
    reference: reservation.public_reference,
    venue_name: venueName,
    customer_name: full_name,
    customer_email: normalizedEmail,
    customer_phone: normalizedPhone,
    customer_company: company,
    event_type,
    attendee_count,
    start_date,
    end_date,
    notes,
  };

  // Send owner notification (don't await to not block response)
  mailService.sendReservationNotification(notificationData).catch(err => {
    logger.error('Failed to send owner notification', { error: err.message });
  });

  // Send customer acknowledgement if enabled
  mailService.sendCustomerAcknowledgement(notificationData).catch(err => {
    logger.error('Failed to send customer ack', { error: err.message });
  });

  return {
    id: reservation.id,
    reference: reservation.public_reference,
    status: reservation.status,
    venue_name: venueName,
    start_date,
    end_date,
    created_at: reservation.created_at,
  };
}

module.exports = {
  getVenues,
  getVenueBySlug,
  getVenueAvailability,
  checkDateOverlap,
  createReservation,
};
