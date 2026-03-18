-- Migration: Create venues table for leisure/event spaces
-- Replaces the multi-tenant rooms concept with a simpler venue model

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_description TEXT,
  full_description TEXT,
  location_text VARCHAR(255),
  capacity INTEGER,
  price_from DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create venue images table
CREATE TABLE IF NOT EXISTS venue_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create venue features/amenities table
CREATE TABLE IF NOT EXISTS venue_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create venue feature links (many-to-many)
CREATE TABLE IF NOT EXISTS venue_feature_links (
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES venue_features(id) ON DELETE CASCADE,
  PRIMARY KEY (venue_id, feature_id)
);

-- Create customers table for reservation requesters
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique index on normalized email (lowercase)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_lower ON customers(LOWER(email));

-- Create index for phone lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(is_active);
CREATE INDEX IF NOT EXISTS idx_venue_images_venue ON venue_images(venue_id);
