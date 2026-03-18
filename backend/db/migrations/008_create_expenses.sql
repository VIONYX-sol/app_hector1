CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE expense_status AS ENUM ('pending','approved','rejected','paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  expense_date DATE NOT NULL,
  due_date DATE,
  status expense_status DEFAULT 'pending',
  payment_method VARCHAR(50),
  provider_name VARCHAR(255),
  provider_tax_id VARCHAR(20),
  invoice_reference VARCHAR(100),
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_config JSONB DEFAULT '{}',
  location_id UUID REFERENCES locations(id),
  tags JSONB DEFAULT '[]',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
