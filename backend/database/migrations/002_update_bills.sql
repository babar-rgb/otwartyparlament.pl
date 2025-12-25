-- Migration: 002_update_bills.sql
-- Description: Update bills table to support Sejm API processes structure
-- Author: Antigravity

-- Since the table is effectively empty and we need significant changes (Integer ID -> String ID likely needed for process codes like 'RPS-123'),
-- we will DROP and recreate.

DROP TABLE IF EXISTS bills;

CREATE TABLE bills (
    id SERIAL PRIMARY KEY, -- Internal DB ID
    process_id VARCHAR(50) UNIQUE, -- Sejm API Process ID (e.g., 'RPS-123')
    number VARCHAR(50), -- Print number (e.g. "123")
    title TEXT,
    description TEXT,
    date DATE,
    status VARCHAR(100),
    type VARCHAR(50), -- 'poselski', 'rzadowy', etc.
    url VARCHAR(500), -- Link to PDF or details
    mp_id INTEGER REFERENCES mps(id), -- Optional leader MP
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bills_number ON bills(number);
CREATE INDEX idx_bills_type ON bills(type);
