-- Each upload session gets a UUID token so two guests with the same name
-- have separate, private album URLs (/guest/[token]).
ALTER TABLE media ADD COLUMN IF NOT EXISTS guest_token UUID;

CREATE INDEX IF NOT EXISTS idx_media_guest_token ON media(guest_token);
