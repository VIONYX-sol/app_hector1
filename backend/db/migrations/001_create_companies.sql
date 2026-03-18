CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  tax_id VARCHAR(20),
  tax_regime VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  province VARCHAR(100),
  country VARCHAR(2) DEFAULT 'ES',
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url TEXT,
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  settings JSONB DEFAULT '{}',
  verifactu_enabled BOOLEAN DEFAULT FALSE,
  verifactu_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON companies(tax_id);
