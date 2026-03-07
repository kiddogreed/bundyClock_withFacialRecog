-- V4: Add shift schedules and employee shift assignment

-- ================================================================
-- shift_schedules table
-- ================================================================
CREATE TABLE IF NOT EXISTS shift_schedules (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(100) NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predefined shifts
INSERT INTO shift_schedules (name, start_time, end_time) VALUES
    ('Morning Shift',   '06:00', '14:00'),
    ('Day Shift',       '08:00', '17:00'),
    ('Afternoon Shift', '14:00', '22:00'),
    ('Night Shift',     '22:00', '06:00')
ON CONFLICT DO NOTHING;

-- ================================================================
-- Add shift columns to employees
-- ================================================================
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS shift_schedule_id UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS custom_shift_start TIME,
    ADD COLUMN IF NOT EXISTS custom_shift_end   TIME;

COMMENT ON COLUMN employees.shift_schedule_id  IS 'FK to predefined shift; NULL when custom shift is used';
COMMENT ON COLUMN employees.custom_shift_start IS 'Custom shift start time (used when shift_schedule_id is NULL)';
COMMENT ON COLUMN employees.custom_shift_end   IS 'Custom shift end time (used when shift_schedule_id is NULL)';

CREATE INDEX IF NOT EXISTS idx_employees_shift_schedule_id ON employees(shift_schedule_id);
