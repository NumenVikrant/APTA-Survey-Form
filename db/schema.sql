-- db/schema.sql
CREATE TABLE IF NOT EXISTS survey_responses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  satisfaction INT NOT NULL CHECK (satisfaction BETWEEN 1 AND 5),
  feedback TEXT,
  consent BOOLEAN NOT NULL DEFAULT FALSE
);

-- Useful index for downloads/sorting
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at DESC);
