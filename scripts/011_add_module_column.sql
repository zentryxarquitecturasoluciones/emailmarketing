-- Agregar columna module a la tabla campaigns para identificar de qué portal es cada campaña
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'nv';

-- Crear índice para filtrar por módulo
CREATE INDEX IF NOT EXISTS idx_campaigns_module ON campaigns(module);

-- Actualizar campañas existentes que no tienen módulo asignado
UPDATE campaigns SET module = 'nv' WHERE module IS NULL;
