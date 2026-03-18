DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM ('individual','business','public_entity');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type customer_type DEFAULT 'individual',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  business_name VARCHAR(255),
  tax_id VARCHAR(20),
  email VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  province VARCHAR(100),
  country VARCHAR(2) DEFAULT 'ES',
  iban VARCHAR(34),
  tags JSONB DEFAULT '[]',
  notes TEXT,
  score INTEGER DEFAULT 50,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_booking_at TIMESTAMP,
  source VARCHAR(50),
  gdpr_consent BOOLEAN DEFAULT FALSE,
  gdpr_consent_at TIMESTAMP,
  marketing_consent BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  outcome VARCHAR(100),
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON customers(tax_id);
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON customer_interactions(customer_id);
