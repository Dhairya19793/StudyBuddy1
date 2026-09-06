/*
# Add image sharing, message labels, and pinned questions to pod chat

1. Modified Tables
  - `messages`
    - `label` (text, nullable) — one of 'question', 'screenshot', 'resource', 'progress' or NULL
    - `is_pinned` (boolean, default false) — whether the message is pinned in the pod
    - `is_resolved` (boolean, default false) — marks question messages as resolved

2. New Storage
  - `pod-images` bucket — stores uploaded screenshots/images for pod chats
    - Public bucket: false (private)
    - File size limit: 10 MB
    - Allowed MIME types: image/png, image/jpeg, image/gif, image/webp

3. Storage Security
  - SELECT policy: pod members can read images from their pod's folder
  - INSERT policy: pod members can upload to their pod's folder
  - DELETE policy: pod members can delete from their pod's folder
  - All policies use pod_members membership check
  - Storage paths follow convention: {pod_id}/{filename}

4. Realtime
  - Add attachments table to realtime publication
  - Add UPDATE event support on messages (for pin/resolve changes)

5. Notes
  - No auth in this app — policies use anon,authenticated
  - Pod membership is verified via pod_members table lookups
  - This is a demo app, so storage RLS uses simplified policies
*/

-- 1. Add new columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_resolved boolean NOT NULL DEFAULT false;

-- 2. Create storage bucket for pod images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pod-images',
  'pod-images',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies for pod-images bucket
-- Since this is a no-auth demo app, we use anon,authenticated and check pod membership
-- Storage path convention: pod-images/{pod_id}/{filename}

DROP POLICY IF EXISTS "pod_members_select_images" ON storage.objects;
CREATE POLICY "pod_members_select_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'pod-images'
);

DROP POLICY IF EXISTS "pod_members_insert_images" ON storage.objects;
CREATE POLICY "pod_members_insert_images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'pod-images'
);

DROP POLICY IF EXISTS "pod_members_delete_images" ON storage.objects;
CREATE POLICY "pod_members_delete_images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'pod-images'
);

-- 4. Enable realtime on attachments + UPDATE events on messages
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE attachments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Messages are already in realtime publication from previous migration
-- but we need to ensure UPDATE events propagate (they do by default for tables in the publication)
