-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
-- Stores core authentication and profile data. 
-- 'profile_data' (JSONB) allows flexibility for bio-metrics, injury history, and equipment without schema migrations.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- JSONB for flexible profile attributes:
    -- {
    --   "age": 30,
    --   "weight_history": [{ "date": "2023-01-01", "weight": 80.5 }],
    --   "height": 180,
    --   "gender": "male",
    --   "injuries": ["L5_S1_herniation", "left_shoulder_impingement"],
    --   "equipment": ["home_gym", "dumbbells", "bench"],
    --   "experience_level": "intermediate"
    -- }
    profile_data JSONB DEFAULT '{}'::JSONB,
    
    onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Exercises Table
-- Static catalog of exercises with normative data links.
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL, -- e.g., 'Chest', 'Back', 'Legs', 'Full Body'
    mechanics TEXT, -- 'Compound', 'Isolation'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    
    -- JSONB for normative data references:
    -- {
    --   "wilks_norm": true,
    --   "category": "powerlifting", 
    --   "primary_mover": "pectoralis_major"
    -- }
    meta_data JSONB DEFAULT '{}'::JSONB
);

-- Normative Standards Table (Separate table for cleaner querying or JSONB in exercises? 
-- Using a dedicated table for complex age/weight lookups might be better, but user requested Seed file, 
-- let's keep it normalized or use a lookup table).
-- Let's stick to the user's prompt implying specific normative values.
CREATE TABLE strength_standards (
    id SERIAL PRIMARY KEY,
    exercise_name TEXT NOT NULL, -- 'Squat', 'Bench Press', 'Deadlift'
    gender TEXT NOT NULL, -- 'male', 'female'
    min_age INTEGER,
    max_age INTEGER,
    weight_class_kg INTEGER, -- Upper bound or specific class
    
    -- JSONB for the standards to avoid overly wide tables
    -- {
    --   "novice": 60,
    --   "intermediate": 85,
    --   "advanced": 110,
    --   "elite": 140
    -- }
    performance_standards JSONB NOT NULL
);

-- Workout Templates (AI Generated Plans)
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enum simulation for Periodization Model
    periodization_model TEXT CHECK (periodization_model IN ('Linear', 'Block', 'Undulating', 'Conjugate')),
    
    -- JSONB for the Full Cycle Structure
    -- [
    --   { "week": 1, "focus": "Hypertrophy", "days": [ ... ] },
    --   { "week": 2, "focus": "Strength", "days": [ ... ] }
    -- ]
    schedule JSONB NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Workout Logs (Actual Training Data)
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_template_id UUID REFERENCES workout_templates(id), -- Optional, if linked to a plan
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Core metrics
    exercise_id INTEGER REFERENCES exercises(id),
    
    -- JSONB for Sets to handle variable set counts cleanly
    -- [
    --   { "reps": 10, "weight": 80, "rpe": 8, "rest_seconds": 90 },
    --   { "reps": 10, "weight": 80, "rpe": 8.5, "rest_seconds": 90 }
    -- ]
    sets JSONB NOT NULL,
    
    -- Calculated Metrics
    volume_load FLOAT, -- Sum of (reps * weight)
    estimated_1rm FLOAT, -- Epley formula or similar
    
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, date);
CREATE INDEX idx_users_email ON users(email);
