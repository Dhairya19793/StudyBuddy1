# StudyMode

A peer-study platform for college students. Students can browse course hubs, post study requests, form small private study pods, chat with shared images and pinned questions, track tasks collaboratively or solo, and use a focus-mode timer -- all with privacy at the core.

## Quick Start

1. **Install dependencies**

   ```
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key:

   ```
   cp .env.example .env
   ```

3. **Run the app**

   ```
   npx expo start
   ```

   - Press **w** to open in a web browser
   - Scan the QR code with Expo Go on your phone

## Supabase Setup

StudyMode requires a Supabase project with the following:

- **Tables**: profiles, courses, course_members, study_requests, request_interests, channels, messages, pods, pod_members, tasks, task_completions, availability_blocks, attachments, study_plans
- **Storage bucket**: `pod-images` (for image sharing in pod chats)
- **Realtime**: enabled on `messages` and `tasks` tables
- **Row Level Security**: enabled on all tables with per-user policies

Migrations in `supabase/migrations/` create all tables and seed demo data automatically.

## Demo Accounts

Three demo accounts are pre-seeded for the hackathon demo. Use the **user switcher** (visible on the Home and Profile screens) to switch between them:

| Name           | Role                        | Key demo content                                   |
| -------------- | --------------------------- | -------------------------------------------------- |
| Aisha Johnson  | Junior, CS                  | Study request for graph traversal, solo plan with a stuck task |
| Jordan Kim     | Sophomore, Software Eng.    | Can express interest in study requests              |
| Maya Patel     | Junior, CS                  | Can express interest and join pods                  |

### Demo Walkthrough

1. **As Aisha**: Open Courses, tap CSC 202, see the study request for graph traversal help
2. **Switch to Jordan**: Tap "Interested" on Aisha's request
3. **Open Pods**: See the "CSC 202 -- Graph Traversal Midterm Pod" with sample messages, a pinned question, and a shared screenshot
4. **Open Solo (workspace)**: Aisha has a "Prepare for Midterm 1" plan with tasks, one marked stuck
5. **Tap a stuck task**: Use "Ask peers for help" to convert it into a study request
6. **Focus Mode**: Tap "Start Focus Mode" on a plan to use the timer

## Architecture

- **Expo Router** with file-based routing and tab navigation
- **Supabase** for database, auth-free demo mode, realtime subscriptions, and file storage
- **React Native** with StyleSheet-based styling (no CSS-in-JS libraries)
- **Responsive**: desktop sidebar layout (900px+) and mobile bottom tabs

## Environment Variables

| Variable                        | Description                |
| ------------------------------- | -------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon API key |

No secret keys are committed to the repository. The anon key is safe for client-side use as it is restricted by Row Level Security policies.
