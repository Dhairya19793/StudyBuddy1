ALTER TABLE study_requests ADD COLUMN IF NOT EXISTS help_type text NOT NULL DEFAULT 'understand-concept';

UPDATE study_requests SET help_type = 'work-through-problems' WHERE topic ILIKE '%AVL%' OR topic ILIKE '%Hash%';
UPDATE study_requests SET help_type = 'understand-concept' WHERE topic ILIKE '%Recursion%';
UPDATE study_requests SET help_type = 'get-feedback' WHERE topic ILIKE '%Peer Review%' OR topic ILIKE '%Essay%';
UPDATE study_requests SET help_type = 'study-alongside' WHERE topic ILIKE '%Source%Brainstorm%';
