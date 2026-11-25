-- Agregar columna recipient_id para trackear envíos por registro único (permite duplicados de email)
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS recipient_id UUID;

-- Crear índice para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_email_events_recipient_id ON email_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_recipient ON email_events(campaign_id, recipient_id);
