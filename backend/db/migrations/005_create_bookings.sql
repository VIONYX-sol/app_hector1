DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending','confirmed','active','completed','cancelled','no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','partial','paid','refunded','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  customer_id UUID,
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  duration_hours DECIMAL(5,2),
  attendees INTEGER DEFAULT 1,
  purpose TEXT,
  notes TEXT,
  internal_notes TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_required DECIMAL(10,2) DEFAULT 0,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) DEFAULT 0,
  extras JSONB DEFAULT '[]',
  source VARCHAR(50) DEFAULT 'admin',
  stripe_payment_intent_id VARCHAR(255),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  confirmed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_company ON bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);
