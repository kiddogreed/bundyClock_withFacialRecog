-- V1__create_initial_tables.sql
-- BundyClock initial schema migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- employees table
-- ================================================================
CREATE TABLE IF NOT EXISTS employees (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255)        NOT NULL,
    employee_code VARCHAR(50)       NOT NULL UNIQUE,
    department  VARCHAR(100),
    email       VARCHAR(255) UNIQUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- attendance_logs table
-- ================================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id      UUID                NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    timestamp        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type             VARCHAR(10)         NOT NULL CHECK (type IN ('TIME_IN', 'TIME_OUT')),
    image_path       VARCHAR(500),
    confidence_score DECIMAL(5, 4),
    verified         BOOLEAN             DEFAULT FALSE,
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- face_embeddings table
-- ================================================================
CREATE TABLE IF NOT EXISTS face_embeddings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID                NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    embedding_vector TEXT,
    raw_image_path  VARCHAR(500),
    model_used      VARCHAR(100)        DEFAULT 'DeepFace',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Indexes
-- ================================================================
CREATE INDEX idx_attendance_logs_employee_id ON attendance_logs(employee_id);
CREATE INDEX idx_attendance_logs_timestamp   ON attendance_logs(timestamp);
CREATE INDEX idx_attendance_logs_type        ON attendance_logs(type);
CREATE INDEX idx_face_embeddings_employee_id ON face_embeddings(employee_id);
CREATE INDEX idx_employees_code              ON employees(employee_code);

-- ================================================================
-- Seed data (dev only — remove for production)
-- ================================================================
INSERT INTO employees (name, employee_code, department, email)
VALUES
    ('Alice Reyes',   'EMP-001', 'Engineering', 'alice@bundyclock.local'),
    ('Bob Santos',    'EMP-002', 'HR',           'bob@bundyclock.local'),
    ('Carlos Dizon',  'EMP-003', 'Operations',   'carlos@bundyclock.local')
ON CONFLICT (employee_code) DO NOTHING;
