-- Seed Exercises
INSERT INTO exercises (name, muscle_group, mechanics, difficulty_level, meta_data) VALUES
('Barbell Squat', 'Legs', 'Compound', 3, '{"primary_mover": "quadriceps", "synergists": ["gluteus_maximus", "adductor_magnus", "soleus"]}'::JSONB),
('Barbell Bench Press', 'Chest', 'Compound', 3, '{"primary_mover": "pectoralis_major", "synergists": ["triceps_brachii", "deltoid_anterior"]}'::JSONB),
('Barbell Deadlift', 'Back', 'Compound', 4, '{"primary_mover": "gluteus_maximus", "synergists": ["quadriceps", "adductor_magnus", "soleus", "erector_spinae"]}'::JSONB),
('Overhead Press', 'Shoulders', 'Compound', 3, '{"primary_mover": "deltoid_anterior", "synergists": ["triceps_brachii", "serratus_anterior"]}'::JSONB),
('Pull Up', 'Back', 'Compound', 3, '{"primary_mover": "latissimus_dorsi", "synergists": ["brachialis", "biceps_brachii"]}'::JSONB),
('Dumbbell Lateral Raise', 'Shoulders', 'Isolation', 2, '{"primary_mover": "deltoid_lateral", "synergists": []}'::JSONB);

-- Seed Strength Standards (Sample Data)
-- Structure matches the logic needed for the "Standard Profile" analysis.
-- Values are roughly based on Wilks/StrengthLevel.com data for male/female (simplified for seeding).
-- Format: Weight class in KG. Performance standards in KG for 1RM.

-- Males, Age 24-30
INSERT INTO strength_standards (exercise_name, gender, min_age, max_age, weight_class_kg, performance_standards) VALUES
('Barbell Bench Press', 'male', 24, 39, 70, '{"novice": 60, "intermediate": 85, "advanced": 110, "elite": 140}'::JSONB),
('Barbell Bench Press', 'male', 24, 39, 80, '{"novice": 70, "intermediate": 95, "advanced": 125, "elite": 160}'::JSONB),
('Barbell Bench Press', 'male', 24, 39, 90, '{"novice": 80, "intermediate": 105, "advanced": 140, "elite": 175}'::JSONB),

('Barbell Squat', 'male', 24, 39, 70, '{"novice": 80, "intermediate": 110, "advanced": 150, "elite": 190}'::JSONB),
('Barbell Squat', 'male', 24, 39, 80, '{"novice": 95, "intermediate": 130, "advanced": 170, "elite": 215}'::JSONB),
('Barbell Squat', 'male', 24, 39, 90, '{"novice": 105, "intermediate": 145, "advanced": 190, "elite": 240}'::JSONB),

('Barbell Deadlift', 'male', 24, 39, 70, '{"novice": 100, "intermediate": 135, "advanced": 180, "elite": 230}'::JSONB),
('Barbell Deadlift', 'male', 24, 39, 80, '{"novice": 115, "intermediate": 155, "advanced": 205, "elite": 260}'::JSONB),
('Barbell Deadlift', 'male', 24, 39, 90, '{"novice": 130, "intermediate": 175, "advanced": 230, "elite": 290}'::JSONB);
