-- Crear tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Política de acceso (abierta para este caso de uso)
DROP POLICY IF EXISTS "Allow all operations" ON system_settings;
CREATE POLICY "Allow all operations" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- Trigger para fecha de actualización
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar valores por defecto
INSERT INTO system_settings (key, value, description) VALUES 
('default_from_name', 'Nevada Business Filings', 'Nombre del remitente por defecto'),
('default_from_email', 'info@nvbizfilings.com', 'Email del remitente por defecto'),
('default_reply_to', 'Info@nationalfilingcorporation.com', 'Email de respuesta por defecto'),
('daily_email_limit', '30', 'Límite diario de correos (Plan Gratis SMTPPrivateOD92)')
ON CONFLICT (key) DO NOTHING;
