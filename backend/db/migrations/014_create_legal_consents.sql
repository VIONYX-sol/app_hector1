CREATE TABLE IF NOT EXISTS legal_consent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  customer_id UUID REFERENCES customers(id),
  consent_version_id UUID REFERENCES legal_consent_versions(id),
  type VARCHAR(100) NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_consents_user ON legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_customer ON legal_consents(customer_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_type ON legal_consents(type);
