-- =====================================================
-- SCRIPT COMPLETO PARA CONFIGURAR LAS 4 BASES DE DATOS
-- =====================================================
-- Este script debe ejecutarse en CADA proyecto de Supabase:
-- 1. NV Biz Filings (ya configurado)
-- 2. Natl Biz Filings (ya configurado) 
-- 3. National Corp Filings (NUEVO)
-- 4. Nat Corp Filings (NUEVO)
-- =====================================================

-- TABLA: campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  reply_to TEXT,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  total_sent INTEGER DEFAULT 0,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  complained_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- TABLA: contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: email_events
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  email_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: email_templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: campaign_recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  email_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: unsubscribes
CREATE TABLE IF NOT EXISTS unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDICES para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(email);

-- Habilitar RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;

-- Politicas de acceso publico
DROP POLICY IF EXISTS "Allow all operations" ON campaigns;
CREATE POLICY "Allow all operations" ON campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON contacts;
CREATE POLICY "Allow all operations" ON contacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON email_events;
CREATE POLICY "Allow all operations" ON email_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON email_templates;
CREATE POLICY "Allow all operations" ON email_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON settings;
CREATE POLICY "Allow all operations" ON settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON campaign_recipients;
CREATE POLICY "Allow all operations" ON campaign_recipients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON unsubscribes;
CREATE POLICY "Allow all operations" ON unsubscribes FOR ALL USING (true) WITH CHECK (true);

-- Configuracion por defecto
INSERT INTO settings (key, value) VALUES 
  ('default_from_email', 'info@tudominio.com'),
  ('default_from_name', 'Tu Empresa'),
  ('company_name', 'Tu Empresa')
ON CONFLICT (key) DO NOTHING;

-- Verificar que todo esta creado
SELECT 'Tablas creadas:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
