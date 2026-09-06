# StudyMode

A peer-study platform built for college students. StudyMode helps students find study partners, organize group sessions, and stay on track with shared and individual goals — all in one focused, distraction-free app.

## Features

### Course Hubs
Each course gets a dedicated space where students can browse and post study requests, see who's interested, and connect with classmates facing the same material.

### Study Pods
Students can form small, private study groups around a specific topic or exam. Each pod has its own chat with image sharing, pinned questions for quick reference, and a shared task list with live progress tracking.

### Solo Workspace
For independent study, students can create personal study plans with task breakdowns. A built-in focus-mode timer helps stay on task, and any stuck task can be escalated into a public study request with one tap.

### Realtime Collaboration
Study requests, pod chats, and task completions update live across all devices using Supabase Realtime, so students always see the latest activity.

### Privacy First
All data is protected by Supabase Row Level Security with per-user policies, ensuring students only see what they're supposed to see.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (React Native) with file-based routing |
| Backend | Supabase (PostgreSQL, Realtime, Storage) |
| Language | TypeScript |
| Styling | StyleSheet with a custom design system |
| Animations | React Native Reanimated |
| Icons | Lucide |

## Design System

StudyMode uses a warm, earthy palette inspired by study spaces — forest green actions, muted gold accents, sage surfaces, and warm off-white backgrounds. The system includes a full color ramp (primary, secondary, accent, success, warning, error, neutral), an 8px spacing scale, and a two-font pairing (Source Serif Pro for headings, Inter for body text).

The interface is fully responsive: on mobile, navigation uses bottom tabs; on desktop (900px+), it switches to a top navigation bar with a two-column home layout.

## Getting Started

1. **Install dependencies**
   ```
   npm install
   ```

2. **Configure environment**
   ```
   cp .env.example .env
   ```
   Add your Supabase project URL and anon key to the `.env` file.

3. **Run the app**
   ```
   npx expo start
   ```
   - Press **w** to open in a web browser
   - Scan the QR code with Expo Go on your phone

## Database

The backend is powered by Supabase with the following structure:

- **Tables**: profiles, courses, course_members, study_requests, request_interests, channels, messages, pods, pod_members, tasks, task_completions, availability_blocks, attachments, study_plans
- **Storage**: `pod-images` bucket for image sharing in pod chats
- **Realtime**: enabled on `messages` and `tasks` tables
- **Security**: Row Level Security on all tables with per-user policies

Migrations in `supabase/migrations/` handle all table creation and seeding automatically.

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon API key |

No secret keys are committed to the repository. The anon key is safe for client-side use as it is restricted by Row Level Security policies.



