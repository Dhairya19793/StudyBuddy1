/*
# Fix image bucket, add DM support, add 3 Cal Poly courses

1. Storage
   - Make `pod-images` bucket public so getPublicUrl() works for image display

2. Channels table modifications
   - Add `is_direct` boolean (default false) — marks a channel as a 1-on-1 DM
   - Add `user1_id`, `user2_id` uuid columns — the two participants in a DM
   - Replace the CHECK constraint to allow DM channels (both course_id and pod_id NULL, is_direct true)
   - Add indexes on user1_id, user2_id for fast DM lookups

3. New courses (Cal Poly SLO catalog)
   - CSC 357 — Systems Programming
   - MATH 244 — Linear Algebra
   - STAT 312 — Statistical Methods for Engineers
   - Enroll all 3 existing demo profiles in each new course
   - Create a default "general" channel for each new course

4. Security
   - All new columns and tables inherit the existing open RLS policies (demo app, no auth)
*/

-- 1. Make pod-images bucket public
UPDATE storage.buckets SET public = true WHERE id = 'pod-images';

-- 2. Add DM support to channels
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_direct boolean NOT NULL DEFAULT false;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Replace the CHECK constraint to allow DM channels
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channel_has_parent;
ALTER TABLE channels ADD CONSTRAINT channel_has_parent CHECK (
  (course_id IS NOT NULL AND pod_id IS NULL AND is_direct = false) OR
  (course_id IS NULL AND pod_id IS NOT NULL AND is_direct = false) OR
  (course_id IS NULL AND pod_id IS NULL AND is_direct = true AND user1_id IS NOT NULL AND user2_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_channels_user1 ON channels(user1_id);
CREATE INDEX IF NOT EXISTS idx_channels_user2 ON channels(user2_id);
CREATE INDEX IF NOT EXISTS idx_channels_is_direct ON channels(is_direct);

-- 3. Add 3 new Cal Poly courses
INSERT INTO courses (id, code, name, department, color) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CSC 357', 'Systems Programming', 'Computer Science', '#1B4332'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'MATH 244', 'Linear Algebra', 'Mathematics', '#3A6B5C'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'STAT 312', 'Statistical Methods for Engineers', 'Statistics', '#4A6741')
ON CONFLICT (code) DO NOTHING;

-- Enroll all 3 demo profiles in each new course
INSERT INTO course_members (course_id, profile_id)
SELECT c.id, p.id FROM courses c, profiles p
WHERE c.code IN ('CSC 357', 'MATH 244', 'STAT 312')
ON CONFLICT DO NOTHING;

-- Create default "general" channel for each new course
INSERT INTO channels (course_id, name)
SELECT id, 'general' FROM courses
WHERE code IN ('CSC 357', 'MATH 244', 'STAT 312')
AND id NOT IN (SELECT course_id FROM channels WHERE course_id IS NOT NULL AND name = 'general')
ON CONFLICT DO NOTHING;
