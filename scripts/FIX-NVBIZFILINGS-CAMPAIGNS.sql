-- ============================================
-- SCRIPT PARA ARREGLAR TABLA CAMPAIGNS
-- Ejecutar en: https://supabase.com/dashboard/project/vdhvyeiqrzmnriirbqqk/sql/new
-- ============================================

-- Primero, vamos a ver qué columnas tiene actualmente la tabla campaigns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'campaigns' 
-- ORDER BY ordinal_position;

-- Agregar columnas faltantes si no existen
DO $$ 
BEGIN
    -- html_content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'html_content') THEN
        ALTER TABLE campaigns ADD COLUMN html_content TEXT;
    END IF;
    
    -- from_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'from_name') THEN
        ALTER TABLE campaigns ADD COLUMN from_name TEXT DEFAULT 'NV Biz Filings';
    END IF;
    
    -- from_email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'from_email') THEN
        ALTER TABLE campaigns ADD COLUMN from_email TEXT DEFAULT 'noreply@nvbizfilings.com';
    END IF;
    
    -- total_recipients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'total_recipients') THEN
        ALTER TABLE campaigns ADD COLUMN total_recipients INTEGER DEFAULT 0;
    END IF;
    
    -- sent_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'sent_count') THEN
        ALTER TABLE campaigns ADD COLUMN sent_count INTEGER DEFAULT 0;
    END IF;
    
    -- delivered_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'delivered_count') THEN
        ALTER TABLE campaigns ADD COLUMN delivered_count INTEGER DEFAULT 0;
    END IF;
    
    -- opened_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'opened_count') THEN
        ALTER TABLE campaigns ADD COLUMN opened_count INTEGER DEFAULT 0;
    END IF;
    
    -- clicked_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'clicked_count') THEN
        ALTER TABLE campaigns ADD COLUMN clicked_count INTEGER DEFAULT 0;
    END IF;
    
    -- bounced_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'bounced_count') THEN
        ALTER TABLE campaigns ADD COLUMN bounced_count INTEGER DEFAULT 0;
    END IF;
    
    -- complained_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'complained_count') THEN
        ALTER TABLE campaigns ADD COLUMN complained_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Verificar que email_events tenga las columnas correctas
DO $$ 
BEGIN
    -- email (en lugar de recipient_email)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'email') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'recipient_email') THEN
            ALTER TABLE email_events RENAME COLUMN recipient_email TO email;
        ELSE
            ALTER TABLE email_events ADD COLUMN email TEXT;
        END IF;
    END IF;
    
    -- SMTPPrivateOD92_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'SMTPPrivateOD92_id') THEN
        ALTER TABLE email_events ADD COLUMN SMTPPrivateOD92_id TEXT;
    END IF;
    
    -- event_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'event_type') THEN
        ALTER TABLE email_events ADD COLUMN event_type TEXT DEFAULT 'sent';
    END IF;
    
    -- timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'timestamp') THEN
        ALTER TABLE email_events ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Verificar la estructura final
SELECT 'campaigns columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;

SELECT 'email_events columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_events' 
ORDER BY ordinal_position;
