-- Add profile photo URL column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url VARCHAR(512);
