ALTER TABLE email_events ADD COLUMN IF NOT EXISTS recipient_id UUID;

CREATE INDEX IF NOT EXISTS idx_email_events_recipient_id ON email_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_recipient ON email_events(campaign_id, recipient_id);
