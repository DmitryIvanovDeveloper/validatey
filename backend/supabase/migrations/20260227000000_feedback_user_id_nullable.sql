-- Allow guest feedback: user_id can be NULL when submitted without session
ALTER TABLE feedback
  ALTER COLUMN user_id DROP NOT NULL;
