-- Add unsubscribed field to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Create index for unsubscribed contacts
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribed ON contacts(unsubscribed);
