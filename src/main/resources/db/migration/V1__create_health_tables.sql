-- Health Hub: Initial Schema
-- Creates tables for tracking mood, alcohol, exercise, sleep, and sex metrics

-- Mood Entry Table
CREATE TABLE mood_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL UNIQUE,
    mood VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mood_entry_date ON mood_entry(entry_date);

-- Alcohol Entry Table
CREATE TABLE alcohol_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL UNIQUE,
    drink_range VARCHAR(20) NOT NULL,
    extras BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alcohol_entry_date ON alcohol_entry(entry_date);

-- Exercise Entry Table (multiple entries per day allowed)
CREATE TABLE exercise_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    activity_type VARCHAR(20) NOT NULL,
    duration_minutes INTEGER,
    steps INTEGER,
    stretching BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercise_entry_date ON exercise_entry(entry_date);

-- Sleep Entry Table
CREATE TABLE sleep_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL UNIQUE,
    quality VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sleep_entry_date ON sleep_entry(entry_date);

-- Sex Entry Table
CREATE TABLE sex_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sex_entry_date ON sex_entry(entry_date);
