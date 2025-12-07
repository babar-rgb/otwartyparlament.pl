-- Committee Sittings Table - Full parliamentary committee work
CREATE TABLE IF NOT EXISTS committee_sittings (
    id SERIAL PRIMARY KEY,
    committee_code TEXT NOT NULL,
    sitting_number INTEGER NOT NULL,
    date DATE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    room TEXT,
    status TEXT,
    is_remote BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    video_url TEXT,
    agenda JSONB,
    term INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(committee_code, sitting_number, term)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_committee_sittings_code ON committee_sittings(committee_code);
CREATE INDEX IF NOT EXISTS idx_committee_sittings_date ON committee_sittings(date);
CREATE INDEX IF NOT EXISTS idx_committee_sittings_status ON committee_sittings(status);

-- Link to committees table
ALTER TABLE committee_sittings 
ADD CONSTRAINT fk_committee_sittings_committee 
FOREIGN KEY (committee_code) REFERENCES committees(code) ON DELETE CASCADE;

-- RLS policies
ALTER TABLE committee_sittings ENABLE ROW LEVEL SECURITY;
CREATE POLICY committee_sittings_read ON committee_sittings FOR SELECT USING (true);
CREATE POLICY committee_sittings_write ON committee_sittings FOR ALL USING (true);

-- Verify
SELECT 'committee_sittings table created' as status;
