DO $$ BEGIN
  CREATE TYPE invoice_type AS ENUM ('invoice','simplified','credit_note','proforma');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft','issued','sent','paid','overdue','cancelled','verifactu_sent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type invoice_type DEFAULT 'invoice',
  status invoice_status DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  issuer_name VARCHAR(255) NOT NULL,
  issuer_tax_id VARCHAR(20) NOT NULL,
  issuer_address TEXT NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_tax_id VARCHAR(20),
  recipient_address TEXT,
  recipient_email VARCHAR(255),
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  irpf_rate DECIMAL(5,2) DEFAULT 0,
  irpf_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_method payment_method,
  paid_at TIMESTAMP,
  verifactu_id VARCHAR(100),
  verifactu_hash VARCHAR(255),
  verifactu_qr TEXT,
  verifactu_status VARCHAR(50),
  verifactu_sent_at TIMESTAMP,
  verifactu_response JSONB,
  notes TEXT,
  internal_notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
