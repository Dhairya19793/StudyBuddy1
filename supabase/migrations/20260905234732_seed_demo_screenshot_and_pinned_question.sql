/*
# Seed demo screenshot message in CSC 202 Graph Traversal Pod

1. New Data
  - A screenshot message from Jordan with attachment (whiteboard diagram)
  - A pinned question message from Maya about BFS/DFS space complexity
  - A response from Aisha explaining the concept
2. Notes
  - Uses channel eeee0004-eeee-4eee-aeee-eeeeeeeeeeee (the demo pod's general channel)
*/

INSERT INTO messages (id, channel_id, author_id, body, is_study_request, label, created_at)
VALUES (
  'ff000001-0000-4000-a000-000000000010',
  'eeee0004-eeee-4eee-aeee-eeeeeeeeeeee',
  '22222222-2222-2222-2222-222222222222',
  'Here is my whiteboard sketch of the BFS vs DFS traversal paths. Can someone check if the BFS queue order is right?',
  false,
  'screenshot',
  now() - interval '18 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachments (id, message_id, url, filename, content_type)
VALUES (
  'aa000001-0000-4000-a000-000000000010',
  'ff000001-0000-4000-a000-000000000010',
  'https://images.pexels.com/photos/5023567/pexels-photo-5023567.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'graph-traversal-bfs-dfs.jpg',
  'image/jpeg'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, channel_id, author_id, body, is_study_request, label, is_pinned, created_at)
VALUES (
  'ff000001-0000-4000-a000-000000000011',
  'eeee0004-eeee-4eee-aeee-eeeeeeeeeeee',
  '33333333-3333-3333-3333-333333333333',
  'Can someone explain why DFS uses O(h) space where h is tree height, but BFS uses O(w) where w is max width? I keep mixing these up.',
  false,
  'question',
  true,
  now() - interval '12 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, channel_id, author_id, body, is_study_request, created_at)
VALUES (
  'ff000001-0000-4000-a000-000000000012',
  'eeee0004-eeee-4eee-aeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'Great diagram Jordan! The BFS queue looks correct to me. Maya -- think of it this way: DFS goes deep first so it only holds one path in memory (the stack), while BFS holds all nodes at the current level (the queue). That is why DFS space is proportional to depth and BFS to width.',
  false,
  now() - interval '10 hours'
)
ON CONFLICT (id) DO NOTHING;
