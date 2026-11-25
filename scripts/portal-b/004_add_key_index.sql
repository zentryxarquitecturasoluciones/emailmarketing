-- Agregar columna key_index para saber qué key se usó
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS key_index INTEGER DEFAULT 0;
