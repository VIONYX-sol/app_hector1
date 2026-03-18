CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name, description, is_system, permissions)
SELECT 'superadmin', 'Super Administrator', TRUE, '["*"]'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'superadmin' AND company_id IS NULL);

INSERT INTO roles (name, description, is_system, permissions)
SELECT 'admin', 'Company Administrator', TRUE, '["companies.*","users.*","rooms.*","bookings.*","payments.*","invoices.*","expenses.*","documents.*","crm.*","analytics.*"]'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin' AND company_id IS NULL);

INSERT INTO roles (name, description, is_system, permissions)
SELECT 'manager', 'Manager', TRUE, '["rooms.*","bookings.*","payments.*","crm.*","analytics.read"]'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'manager' AND company_id IS NULL);

INSERT INTO roles (name, description, is_system, permissions)
SELECT 'staff', 'Staff Member', TRUE, '["bookings.read","bookings.create","rooms.read","crm.read"]'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'staff' AND company_id IS NULL);

INSERT INTO roles (name, description, is_system, permissions)
SELECT 'client', 'Client', TRUE, '["bookings.own","payments.own","invoices.own","documents.own"]'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'client' AND company_id IS NULL);
