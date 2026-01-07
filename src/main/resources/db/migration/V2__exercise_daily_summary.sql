-- Move steps and stretching to a daily summary table

-- Create exercise daily summary table
CREATE TABLE exercise_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL UNIQUE,
    steps INTEGER,
    stretching BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercise_daily_summary_date ON exercise_daily_summary(entry_date);

-- Migrate existing data: aggregate steps and stretching per day
INSERT INTO exercise_daily_summary (entry_date, steps, stretching)
SELECT
    entry_date,
    MAX(steps),
    BOOL_OR(stretching)
FROM exercise_entry
GROUP BY entry_date
ON CONFLICT (entry_date) DO NOTHING;

-- Remove steps and stretching columns from exercise_entry
ALTER TABLE exercise_entry DROP COLUMN IF EXISTS steps;
ALTER TABLE exercise_entry DROP COLUMN IF EXISTS stretching;
