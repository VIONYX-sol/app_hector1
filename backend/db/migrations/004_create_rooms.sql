CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  province VARCHAR(100),
  country VARCHAR(2) DEFAULT 'ES',
  phone VARCHAR(20),
  email VARCHAR(255),
  description TEXT,
  photos JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  description TEXT,
  capacity INTEGER,
  area_sqm DECIMAL(10,2),
  floor INTEGER,
  photos JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  price_per_hour DECIMAL(10,2),
  price_per_day DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  minimum_hours DECIMAL(5,2) DEFAULT 1,
  maximum_hours DECIMAL(5,2),
  advance_booking_days INTEGER DEFAULT 90,
  cancellation_hours INTEGER DEFAULT 24,
  availability_schedule JSONB DEFAULT '{}',
  blocked_dates JSONB DEFAULT '[]',
  extras JSONB DEFAULT '[]',
  rules TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_company ON rooms(company_id);
CREATE INDEX IF NOT EXISTS idx_rooms_location ON rooms(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_company ON locations(company_id);
