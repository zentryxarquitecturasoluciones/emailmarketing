-- ============================================
-- NVBIZFILINGS - CONFIGURACION DE BASE DE DATOS
-- Ejecuta esto UNA SOLA VEZ en Supabase SQL Editor
-- ============================================

-- PASO 1: Crear tablas principales
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  from_email TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  total_sent INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  complained_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES email_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, contact_id)
);

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, email)
);

-- PASO 2: Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribed ON contacts(unsubscribed);
CREATE INDEX IF NOT EXISTS idx_list_contacts_list_id ON list_contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_list_contacts_contact_id ON list_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);

-- PASO 3: Habilitar Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas de acceso (permitir todo para service role)
DROP POLICY IF EXISTS "Allow all operations" ON campaigns;
DROP POLICY IF EXISTS "Allow all operations" ON contacts;
DROP POLICY IF EXISTS "Allow all operations" ON email_lists;
DROP POLICY IF EXISTS "Allow all operations" ON list_contacts;
DROP POLICY IF EXISTS "Allow all operations" ON email_events;
DROP POLICY IF EXISTS "Allow all operations" ON campaign_recipients;

CREATE POLICY "Allow all operations" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON email_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON list_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON email_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON campaign_recipients FOR ALL USING (true) WITH CHECK (true);

-- PASO 5: Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- PASO 6: Triggers para auto-actualizar updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_email_lists_updated_at ON email_lists;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_lists_updated_at BEFORE UPDATE ON email_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETADO! La base de datos está lista.
-- ============================================
