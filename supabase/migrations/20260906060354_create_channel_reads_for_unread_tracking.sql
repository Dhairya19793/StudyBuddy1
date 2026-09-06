/*
# Create channel_reads table for unread message tracking

1. New Tables
   - `channel_reads`
     - `id` (uuid, primary key)
     - `profile_id` (uuid, FK to profiles, not null)
     - `channel_id` (uuid, FK to channels, not null)
     - `last_read_at` (timestamptz, default now())
     - Unique constraint on (profile_id, channel_id)

2. Security
   - Enable RLS on `channel_reads`.
   - Allow anon + authenticated full CRUD (demo app, no auth).

3. Purpose
   - Track when each user last read each channel.
   - Used to compute unread message counts per conversation.
*/

CREATE TABLE IF NOT EXISTS channel_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, channel_id)
);

ALTER TABLE channel_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_channel_reads" ON channel_reads;
CREATE POLICY "anon_select_channel_reads" ON channel_reads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_channel_reads" ON channel_reads;
CREATE POLICY "anon_insert_channel_reads" ON channel_reads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_channel_reads" ON channel_reads;
CREATE POLICY "anon_update_channel_reads" ON channel_reads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_channel_reads" ON channel_reads;
CREATE POLICY "anon_delete_channel_reads" ON channel_reads FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_channel_reads_profile ON channel_reads(profile_id);
CREATE INDEX IF NOT EXISTS idx_channel_reads_channel ON channel_reads(channel_id);
