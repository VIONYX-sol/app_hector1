-- Migration: Create reservations table for venue bookings
-- This is a simplified reservation model for full-day venue bookings

-- Create reservation status enum
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'owner_blocked'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_reference VARCHAR(20) UNIQUE,
  venue_id UUID NOT NULL REFERENCES venues(id),
  customer_id UUID REFERENCES customers(id),
  
  -- Snapshot of customer data at time of reservation (for historical accuracy)
  customer_name_snapshot VARCHAR(255) NOT NULL,
  customer_email_snapshot VARCHAR(255) NOT NULL,
  customer_phone_snapshot VARCHAR(50),
  customer_company_snapshot VARCHAR(255),
  
  -- Event details
  event_type VARCHAR(100),
  attendee_count INTEGER,
  
  -- Date range (inclusive, full-day bookings)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status and source
  status reservation_status DEFAULT 'pending',
  source VARCHAR(50) DEFAULT 'public_web',
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: end_date must be >= start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create reservation status history table
CREATE TABLE IF NOT EXISTS reservation_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_status reservation_status,
  new_status reservation_status NOT NULL,
  changed_by_admin_id UUID REFERENCES admin_users(id),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create venue blocks table (manual unavailability)
CREATE TABLE IF NOT EXISTS venue_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_by_admin_id UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: end_date must be >= start_date
  CONSTRAINT valid_block_date_range CHECK (end_date >= start_date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_reservations_venue ON reservations(venue_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_reference ON reservations(public_reference);
CREATE INDEX IF NOT EXISTS idx_reservations_created ON reservations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_history_reservation ON reservation_status_history(reservation_id);
CREATE INDEX IF NOT EXISTS idx_venue_blocks_venue ON venue_blocks(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_blocks_dates ON venue_blocks(start_date, end_date);

-- Function to generate public reference
CREATE OR REPLACE FUNCTION generate_reservation_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_reference IS NULL THEN
    NEW.public_reference := 'RES-' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate public reference
DROP TRIGGER IF EXISTS reservation_reference_trigger ON reservations;
CREATE TRIGGER reservation_reference_trigger
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION generate_reservation_reference();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
