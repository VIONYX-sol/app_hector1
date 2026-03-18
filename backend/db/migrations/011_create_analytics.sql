CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id VARCHAR(100),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  page VARCHAR(255),
  properties JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) DEFAULT 0,
  dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, date, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_company ON analytics_events(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_company ON analytics_daily_summary(company_id, date);
