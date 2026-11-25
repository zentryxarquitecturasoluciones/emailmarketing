-- Agregar columna reply_to a la tabla campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reply_to TEXT;
