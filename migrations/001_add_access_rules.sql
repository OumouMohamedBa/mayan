-- Migration: Add access_rules table and status column to users
-- Run this on existing database

-- Add status column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';

-- Create access_rules table
CREATE TABLE IF NOT EXISTS access_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('document', 'folder', 'tag', 'category')),
    target_id VARCHAR(255) NOT NULL,
    target_name VARCHAR(255),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_access_rules_user ON access_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_target ON access_rules(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_dates ON access_rules(start_date, end_date);
