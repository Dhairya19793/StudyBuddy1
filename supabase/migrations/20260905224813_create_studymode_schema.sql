/*
# StudyMode Database Schema

1. New Tables
  - `profiles` — student profiles (id, name, initials, email, year, major, instagram, discord, created_at)
  - `courses` — Cal Poly courses (id, code, name, department, color)
  - `course_members` — many-to-many linking students to courses (profile_id, course_id)
  - `availability_blocks` — per-student weekly time slots (profile_id, day_of_week, start_time, end_time)
  - `study_requests` — structured help requests in course hubs (id, course_id, author_id, help_needed, topic, availability_text, preference, group_size, is_posted_to_hub, created_at)
  - `request_interests` — students who expressed interest in a study request (request_id, profile_id)
  - `pods` — private peer study groups (id, name, course_id, topic, created_at)
  - `pod_members` — many-to-many linking students to pods (pod_id, profile_id)
  - `channels` — chat channels belonging to a course or pod (id, course_id, pod_id, name)
  - `messages` — chat messages in a channel (id, channel_id, author_id, body, is_study_request, study_request_id, created_at)
  - `attachments` — file attachments on messages (id, message_id, url, filename, content_type)
  - `tasks` — shared study tasks within a pod (id, pod_id, text, assignee_id, completed, created_at)
  - `task_completions` — solo workspace task completions per user (id, profile_id, text, course_id, completed, is_stuck, created_at)

2. Security
  - RLS enabled on ALL tables.
  - Demo/hackathon mode: policies allow anon + authenticated full CRUD with USING(true).
  - This is intentional for the demo-user-switcher pattern where we switch user context client-side.

3. Notes
  - UUIDs used as primary keys throughout.
  - Foreign keys enforce referential integrity.
  - Indexes on common query patterns (course lookups, channel messages, pod tasks).
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  initials text NOT NULL,
  email text UNIQUE NOT NULL,
  year text NOT NULL,
  major text NOT NULL,
  instagram text,
  discord text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department text NOT NULL,
  color text NOT NULL DEFAULT '#2D5F3A'
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- course_members
-- ============================================================
CREATE TABLE IF NOT EXISTS course_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(profile_id, course_id)
);

ALTER TABLE course_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_course_members" ON course_members;
CREATE POLICY "anon_select_course_members" ON course_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_course_members" ON course_members;
CREATE POLICY "anon_insert_course_members" ON course_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_course_members" ON course_members;
CREATE POLICY "anon_update_course_members" ON course_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_course_members" ON course_members;
CREATE POLICY "anon_delete_course_members" ON course_members FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_course_members_profile ON course_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_course_members_course ON course_members(course_id);

-- ============================================================
-- availability_blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL
);

ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_availability_blocks" ON availability_blocks;
CREATE POLICY "anon_select_availability_blocks" ON availability_blocks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_availability_blocks" ON availability_blocks;
CREATE POLICY "anon_insert_availability_blocks" ON availability_blocks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_availability_blocks" ON availability_blocks;
CREATE POLICY "anon_update_availability_blocks" ON availability_blocks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_availability_blocks" ON availability_blocks;
CREATE POLICY "anon_delete_availability_blocks" ON availability_blocks FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_availability_profile ON availability_blocks(profile_id);

-- ============================================================
-- study_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS study_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  help_needed text NOT NULL,
  topic text NOT NULL,
  availability_text text NOT NULL,
  preference text NOT NULL DEFAULT 'flexible',
  group_size int NOT NULL DEFAULT 3,
  is_posted_to_hub boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_study_requests" ON study_requests;
CREATE POLICY "anon_select_study_requests" ON study_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_study_requests" ON study_requests;
CREATE POLICY "anon_insert_study_requests" ON study_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_study_requests" ON study_requests;
CREATE POLICY "anon_update_study_requests" ON study_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_study_requests" ON study_requests;
CREATE POLICY "anon_delete_study_requests" ON study_requests FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_study_requests_course ON study_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_study_requests_author ON study_requests(author_id);

-- ============================================================
-- request_interests
-- ============================================================
CREATE TABLE IF NOT EXISTS request_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, profile_id)
);

ALTER TABLE request_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_request_interests" ON request_interests;
CREATE POLICY "anon_select_request_interests" ON request_interests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_request_interests" ON request_interests;
CREATE POLICY "anon_insert_request_interests" ON request_interests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_request_interests" ON request_interests;
CREATE POLICY "anon_update_request_interests" ON request_interests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_request_interests" ON request_interests;
CREATE POLICY "anon_delete_request_interests" ON request_interests FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_request_interests_request ON request_interests(request_id);

-- ============================================================
-- pods
-- ============================================================
CREATE TABLE IF NOT EXISTS pods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pods" ON pods;
CREATE POLICY "anon_select_pods" ON pods FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pods" ON pods;
CREATE POLICY "anon_insert_pods" ON pods FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pods" ON pods;
CREATE POLICY "anon_update_pods" ON pods FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pods" ON pods;
CREATE POLICY "anon_delete_pods" ON pods FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_pods_course ON pods(course_id);

-- ============================================================
-- pod_members
-- ============================================================
CREATE TABLE IF NOT EXISTS pod_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id uuid NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(pod_id, profile_id)
);

ALTER TABLE pod_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pod_members" ON pod_members;
CREATE POLICY "anon_select_pod_members" ON pod_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pod_members" ON pod_members;
CREATE POLICY "anon_insert_pod_members" ON pod_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pod_members" ON pod_members;
CREATE POLICY "anon_update_pod_members" ON pod_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pod_members" ON pod_members;
CREATE POLICY "anon_delete_pod_members" ON pod_members FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_pod_members_pod ON pod_members(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_members_profile ON pod_members(profile_id);

-- ============================================================
-- channels
-- ============================================================
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  pod_id uuid REFERENCES pods(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'general',
  CONSTRAINT channel_has_parent CHECK (
    (course_id IS NOT NULL AND pod_id IS NULL) OR
    (course_id IS NULL AND pod_id IS NOT NULL)
  )
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_channels" ON channels;
CREATE POLICY "anon_select_channels" ON channels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_channels" ON channels;
CREATE POLICY "anon_insert_channels" ON channels FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_channels" ON channels;
CREATE POLICY "anon_update_channels" ON channels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_channels" ON channels;
CREATE POLICY "anon_delete_channels" ON channels FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_channels_course ON channels(course_id);
CREATE INDEX IF NOT EXISTS idx_channels_pod ON channels(pod_id);

-- ============================================================
-- messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_study_request boolean NOT NULL DEFAULT false,
  study_request_id uuid REFERENCES study_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- ============================================================
-- attachments
-- ============================================================
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url text NOT NULL,
  filename text NOT NULL,
  content_type text NOT NULL DEFAULT 'image/png'
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attachments" ON attachments;
CREATE POLICY "anon_select_attachments" ON attachments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attachments" ON attachments;
CREATE POLICY "anon_insert_attachments" ON attachments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attachments" ON attachments;
CREATE POLICY "anon_update_attachments" ON attachments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attachments" ON attachments;
CREATE POLICY "anon_delete_attachments" ON attachments FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- tasks (pod shared tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id uuid NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  text text NOT NULL,
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tasks_pod ON tasks(pod_id);

-- ============================================================
-- task_completions (solo workspace per-user tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  completed boolean NOT NULL DEFAULT false,
  is_stuck boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_task_completions" ON task_completions;
CREATE POLICY "anon_select_task_completions" ON task_completions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_task_completions" ON task_completions;
CREATE POLICY "anon_insert_task_completions" ON task_completions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_task_completions" ON task_completions;
CREATE POLICY "anon_update_task_completions" ON task_completions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_task_completions" ON task_completions;
CREATE POLICY "anon_delete_task_completions" ON task_completions FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_task_completions_profile ON task_completions(profile_id);
