-- Create interpellations table
CREATE TABLE IF NOT EXISTS interpellations (
    id INTEGER PRIMARY KEY, -- Maps to 'num' from API
    title TEXT NOT NULL,
    sent_date DATE,
    last_modified TIMESTAMP WITH TIME ZONE,
    raw_data JSONB -- Store full API response just in case
);

-- Create interpellation_authors table (Many-to-Many relationship between Interpellations and MPs)
CREATE TABLE IF NOT EXISTS interpellation_authors (
    interpellation_id INTEGER REFERENCES interpellations(id) ON DELETE CASCADE,
    mp_id INTEGER REFERENCES mps(id) ON DELETE CASCADE,
    PRIMARY KEY (interpellation_id, mp_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interpellations_sent_date ON interpellations(sent_date);
CREATE INDEX IF NOT EXISTS idx_interpellation_authors_mp_id ON interpellation_authors(mp_id);
