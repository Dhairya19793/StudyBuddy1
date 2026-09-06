/*
# Create study_plans table and extend task_completions for Solo Workspace

1. New Tables
  - `study_plans`
    - `id` (uuid, PK)
    - `profile_id` (uuid, FK to profiles) — the plan owner
    - `course_id` (uuid, FK to courses) — connected course
    - `title` (text) — goal/title for the plan
    - `due_date` (date, nullable) — target study date
    - `note` (text, nullable) — optional note
    - `created_at` (timestamptz)

2. Modified Tables
  - `task_completions`
    - `plan_id` (uuid, nullable FK to study_plans) — links task to a plan
    - `duration_minutes` (integer, nullable) — estimated duration in minutes
    - `sort_order` (integer, default 0) — for manual reordering

3. Security
  - RLS enabled on study_plans
  - Open demo-mode policies (anon,authenticated) since no auth in this app
  - Privacy is enforced via profile_id filtering in the frontend

4. Demo Data
  - Aisha gets a CSC 202 plan titled "Prepare for Midterm 1"
  - 4 tasks seeded: Review DFS/BFS notes (completed), Solve Practice Problem 1,
    Revisit graph traversal mistakes (stuck), Explain Big-O in my own words
  - Each task has a duration estimate

5. Notes
  - Idempotent: uses IF NOT EXISTS / ON CONFLICT
*/

-- 1. Create study_plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_study_plans" ON study_plans;
CREATE POLICY "anon_select_study_plans" ON study_plans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_study_plans" ON study_plans;
CREATE POLICY "anon_insert_study_plans" ON study_plans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_study_plans" ON study_plans;
CREATE POLICY "anon_update_study_plans" ON study_plans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_study_plans" ON study_plans;
CREATE POLICY "anon_delete_study_plans" ON study_plans FOR DELETE
  TO anon, authenticated USING (true);

-- 2. Add columns to task_completions
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES study_plans(id) ON DELETE CASCADE;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- 3. Index for fast plan lookups
CREATE INDEX IF NOT EXISTS idx_task_completions_plan_id ON task_completions(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_profile_id ON study_plans(profile_id);

-- 4. Seed Aisha's demo study plan
INSERT INTO study_plans (id, profile_id, course_id, title, due_date, note)
VALUES (
  'bbbb0001-0000-4000-a000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Prepare for Midterm 1',
  '2026-09-12',
  'Focus on graph algorithms and Big-O analysis. Midterm covers chapters 5-8.'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed tasks for Aisha's plan
INSERT INTO task_completions (id, profile_id, text, course_id, plan_id, completed, is_stuck, duration_minutes, sort_order, created_at)
VALUES
  ('bb000001-0000-4000-a000-000000000001', '11111111-1111-1111-1111-111111111111', 'Review DFS/BFS notes from lectures 9-11', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbb0001-0000-4000-a000-000000000001', true, false, 30, 0, now() - interval '3 days'),
  ('bb000001-0000-4000-a000-000000000002', '11111111-1111-1111-1111-111111111111', 'Solve Practice Problem Set 1 (graph traversal)', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbb0001-0000-4000-a000-000000000001', false, false, 45, 1, now() - interval '2 days'),
  ('bb000001-0000-4000-a000-000000000003', '11111111-1111-1111-1111-111111111111', 'Revisit graph traversal mistakes from HW 3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbb0001-0000-4000-a000-000000000001', false, true, 30, 2, now() - interval '1 day'),
  ('bb000001-0000-4000-a000-000000000004', '11111111-1111-1111-1111-111111111111', 'Explain Big-O for BFS and DFS in my own words', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbb0001-0000-4000-a000-000000000001', false, false, 20, 3, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;
