-- V3: Add employment status to employees table
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

COMMENT ON COLUMN employees.status IS 'Employment status: ACTIVE, ON_LEAVE, RESIGNED';
