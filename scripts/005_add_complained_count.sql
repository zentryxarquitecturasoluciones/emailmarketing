-- Add complained_count column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS complained_count INTEGER DEFAULT 0;
