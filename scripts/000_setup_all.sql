-- ============================================
-- SCRIPT DE CONFIGURACION COMPLETA
-- Ejecuta esto UNA SOLA VEZ para crear todas las tablas
-- ============================================

-- PASO 1: Crear tablas principales
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS list_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES email_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, contact_id)
);

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  email_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, email)
);

-- PASO 2: Crear índices
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_contact_email ON email_events(contact_email);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_list_contacts_list_id ON list_contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_list_contacts_contact_id ON list_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribed ON contacts(unsubscribed);

-- PASO 3: Habilitar Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas de acceso
DROP POLICY IF EXISTS "Allow all on campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow all on email_lists" ON email_lists;
DROP POLICY IF EXISTS "Allow all on contacts" ON contacts;
DROP POLICY IF EXISTS "Allow all on list_contacts" ON list_contacts;
DROP POLICY IF EXISTS "Allow all on email_events" ON email_events;
DROP POLICY IF EXISTS "Allow all on campaign_recipients" ON campaign_recipients;

CREATE POLICY "Allow all on campaigns" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on email_lists" ON email_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on list_contacts" ON list_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on email_events" ON email_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on campaign_recipients" ON campaign_recipients FOR ALL USING (true) WITH CHECK (true);

-- COMPLETADO
-- La base de datos está lista para usar
