ALTER TABLE campaign_recipients DROP CONSTRAINT IF EXISTS campaign_recipients_campaign_id_email_key;

ALTER TABLE campaign_recipients ADD COLUMN IF NOT EXISTS row_index INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_row ON campaign_recipients(campaign_id, row_index);
