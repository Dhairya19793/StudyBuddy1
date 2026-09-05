/*
# Seed demo Peer Pod + enable Realtime

Retry with idempotent pod_members insert and realtime enablement.
*/

-- Pod members - use DO block to handle existing entries
DO $$ BEGIN
  INSERT INTO pod_members (id, pod_id, profile_id)
  SELECT 'dd000001-0000-4000-a000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111'
  WHERE NOT EXISTS (SELECT 1 FROM pod_members WHERE pod_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' AND profile_id = '11111111-1111-1111-1111-111111111111');

  INSERT INTO pod_members (id, pod_id, profile_id)
  SELECT 'dd000001-0000-4000-a000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222'
  WHERE NOT EXISTS (SELECT 1 FROM pod_members WHERE pod_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' AND profile_id = '22222222-2222-2222-2222-222222222222');

  INSERT INTO pod_members (id, pod_id, profile_id)
  SELECT 'dd000001-0000-4000-a000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333'
  WHERE NOT EXISTS (SELECT 1 FROM pod_members WHERE pod_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' AND profile_id = '33333333-3333-3333-3333-333333333333');
END $$;

-- Add study_request_id to availability_blocks
ALTER TABLE availability_blocks ADD COLUMN IF NOT EXISTS study_request_id uuid REFERENCES study_requests(id) ON DELETE SET NULL;

-- Enable Realtime (safe to re-run - will error silently if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
