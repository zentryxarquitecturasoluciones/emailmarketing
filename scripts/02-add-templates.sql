-- Crear tabla de plantillas
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar seguridad
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Política de acceso (abierta para este caso de uso)
DROP POLICY IF EXISTS "Allow all operations" ON email_templates;
CREATE POLICY "Allow all operations" ON email_templates FOR ALL USING (true) WITH CHECK (true);

-- Trigger para fecha de actualización
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar plantillas predefinidas
INSERT INTO email_templates (name, subject, content) VALUES 
(
  'Plantilla Corporativa Básica', 
  'Comunicado Importante de nvbizfilings',
  '<h1>Hola!</h1>
<p>Esperamos que estés teniendo un excelente día.</p>
<p>Te escribimos para informarte sobre...</p>
<br>
<p>Atentamente,</p>
<p><strong>El equipo de nvbizfilings</strong></p>'
),
(
  'Newsletter Mensual', 
  'Novedades de nvbizfilings',
  '<h1>Novedades del Mes</h1>
<p>Aquí tienes las últimas actualizaciones sobre tus trámites y servicios.</p>
<h2>Destacado</h2>
<p>Hemos mejorado nuestro sistema de notificaciones para mantenerte siempre informado.</p>
<br>
<a href="https://nvbizfilings.com" style="background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visitar Sitio Web</a>'
),
(
  'Recordatorio de Vencimiento', 
  'Recordatorio: Acción Requerida',
  '<h1>Recordatorio Importante</h1>
<p>Este es un recordatorio amable sobre la documentación pendiente.</p>
<p>Por favor, revisa los detalles adjuntos o ingresa a tu cuenta para más información.</p>
<br>
<p>Si ya has realizado este trámite, por favor ignora este mensaje.</p>'
);
