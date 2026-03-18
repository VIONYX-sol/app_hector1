CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'staff',
  permissions JSONB DEFAULT '[]',
  google_id VARCHAR(255),
  apple_id VARCHAR(255),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  mfa_backup_codes JSONB DEFAULT '[]',
  refresh_token_hash VARCHAR(255),
  refresh_token_expires TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  gdpr_consent BOOLEAN DEFAULT FALSE,
  gdpr_consent_at TIMESTAMP,
  language VARCHAR(10) DEFAULT 'es',
  timezone VARCHAR(50) DEFAULT 'Europe/Madrid',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, company_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email_company ON users(email, company_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
