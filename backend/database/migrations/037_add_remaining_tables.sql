-- Create committees table
CREATE TABLE IF NOT EXISTS committees (
    code VARCHAR PRIMARY KEY,
    name VARCHAR,
    name_genitive VARCHAR,
    committee_type VARCHAR,
    phone VARCHAR,
    term INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create committee_members table
CREATE TABLE IF NOT EXISTS committee_members (
    id SERIAL PRIMARY KEY,
    committee_code VARCHAR REFERENCES committees(code),
    mp_id INTEGER REFERENCES mps(id),
    function VARCHAR,
    from_date DATE,
    to_date DATE,
    term INTEGER
);

-- Create asset_declarations table
CREATE TABLE IF NOT EXISTS asset_declarations (
    id SERIAL PRIMARY KEY,
    mp_id INTEGER REFERENCES mps(id),
    year VARCHAR,
    type VARCHAR,
    pdf_url VARCHAR,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create euro_meps table
CREATE TABLE IF NOT EXISTS euro_meps (
    id SERIAL PRIMARY KEY,
    api_id INTEGER UNIQUE,
    name VARCHAR,
    party VARCHAR
);

-- Create euro_votes table
CREATE TABLE IF NOT EXISTS euro_votes (
    id VARCHAR PRIMARY KEY,
    title TEXT,
    date DATE,
    votes_for INTEGER,
    votes_against INTEGER,
    votes_abstain INTEGER,
    importance_score INTEGER,
    is_key_vote BOOLEAN,
    term INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create euro_vote_results table
CREATE TABLE IF NOT EXISTS euro_vote_results (
    id SERIAL PRIMARY KEY,
    vote_id VARCHAR REFERENCES euro_votes(id),
    mep_id INTEGER,
    vote VARCHAR
);
