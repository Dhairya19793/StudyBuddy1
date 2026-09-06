/*
# Fix course names, deduplicate DM channels, and update storage policies

1. Course name changes (data update, no schema change):
   - CSC 202 -> CSC 2001, "Data Structures"
   - ENGL 145 -> ENG 1145, "Writing Arguments"
   - CSC 357 -> CSC 2050, "Systems Software Mechanics"
   - MATH 244 -> MATH 1262, "Calculus 2"
   - STAT 312 -> STAT 3210, "Engineering Statistics"

2. DM channel deduplication:
   - Adds a unique index on (LEAST(user1_id, user2_id)) for is_direct channels
   - Cleans up existing duplicate DM channels keeping one per pair

3. Storage policies:
   - Ensures the pod-images bucket allows anon/authenticated read and upload

4. Study request deletion:
   - Adds delete policy on study_requests for anon+authenticated (no-auth app)
*/

-- ── 1. Update course names and codes ──
UPDATE courses SET code = 'CSC 2001', name = 'Data Structures' WHERE code = 'CSC 202';
UPDATE courses SET code = 'ENG 1145', name = 'Writing Arguments' WHERE code = 'ENGL 145';
UPDATE courses SET code = 'CSC 2050', name = 'Systems Software Mechanics' WHERE code = 'CSC 357';
UPDATE courses SET code = 'MATH 1262', name = 'Calculus 2' WHERE code = 'MATH 244';
UPDATE courses SET code = 'STAT 3210', name = 'Engineering Statistics' WHERE code = 'STAT 312';

-- ── 2. Deduplicate DM channels ──
-- Delete duplicate DM channels, keeping one per pair (by id ordering)
DELETE FROM channels
WHERE is_direct = true
  AND id NOT IN (
    SELECT DISTINCT ON (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
           id
    FROM channels
    WHERE is_direct = true
    ORDER BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id), id
  );

-- Add unique index to prevent future duplicate DMs
DROP INDEX IF EXISTS unique_dm_pair;
CREATE UNIQUE INDEX unique_dm_pair
  ON channels (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
  WHERE is_direct = true;

-- ── 3. Storage policies for pod-images bucket ──
DROP POLICY IF EXISTS "anon_upload_pod_images" ON storage.objects;
CREATE POLICY "anon_upload_pod_images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'pod-images');

DROP POLICY IF EXISTS "anon_read_pod_images" ON storage.objects;
CREATE POLICY "anon_read_pod_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'pod-images');

-- ── 4. Study request delete policy ──
ALTER TABLE study_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_delete_study_requests" ON study_requests;
CREATE POLICY "anon_delete_study_requests"
  ON study_requests FOR DELETE
  TO anon, authenticated
  USING (true);
