-- Create interpellation_authors table if not exists
CREATE TABLE IF NOT EXISTS interpellation_authors (
    interpellation_id INTEGER REFERENCES interpellations(id),
    mp_id INTEGER REFERENCES mps(id),
    PRIMARY KEY (interpellation_id, mp_id)
);
