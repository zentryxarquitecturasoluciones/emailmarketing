-- Add missing columns to Portal B database
-- Run this script in Supabase SQL Editor for: https://udexpazkxkwqxheoklpv.supabase.co

-- Add content column (the code uses 'content' instead of 'html_content')
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS content TEXT;

-- Add reply_to column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reply_to TEXT;

-- Copy data from html_content to content if exists
UPDATE campaigns SET content = html_content WHERE content IS NULL AND html_content IS NOT NULL;
