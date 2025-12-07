-- Day 1 Enhancement: Frontend Helper Functions
-- RPC functions for easy frontend querying

-- Function 1: Get votes by category with pagination
CREATE OR REPLACE FUNCTION get_votes_by_category(
  category_param TEXT,
  page_num INTEGER DEFAULT 0,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id INTEGER,
  sitting INTEGER,
  voting_number INTEGER,
  date DATE,
  title_clean TEXT,
  verdict TEXT,
  category TEXT,
  term INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.sitting,
    v.voting_number,
    v.date,
    v.title_clean,
    v.verdict,
    v.category,
    v.term
  FROM votes v
  WHERE v.category = category_param
  ORDER BY v.date DESC
  LIMIT page_size
  OFFSET (page_num * page_size);
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get club members with stats
CREATE OR REPLACE FUNCTION get_club_members(club_code_param TEXT)
RETURNS TABLE (
  mp_id INTEGER,
  mp_name TEXT,
  photo_url TEXT,
  stats_attendance DOUBLE PRECISION,
  stats_rebellion INTEGER,
  joined_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as mp_id,
    m.name as mp_name,
    m.photo_url,
    m.stats_attendance,
    m.stats_rebellion,
    cm.from_date as joined_date
  FROM mps m
  JOIN club_memberships cm ON m.id = cm.mp_id
  WHERE cm.club_code = club_code_param 
    AND cm.to_date IS NULL
  ORDER BY m.name;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Category breakdown for term
CREATE OR REPLACE FUNCTION get_category_breakdown(term_param INTEGER DEFAULT 10)
RETURNS TABLE (
  category TEXT,
  vote_count BIGINT,
  passed_count BIGINT,
  pass_rate NUMERIC,
  latest_vote DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.category,
    COUNT(*) as vote_count,
    COUNT(*) FILTER (WHERE v.verdict = 'PRZYJĘTO') as passed_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE v.verdict = 'PRZYJĘTO') / COUNT(*), 1) as pass_rate,
    MAX(v.date) as latest_vote
  FROM votes v
  WHERE v.term = term_param AND v.category IS NOT NULL
  GROUP BY v.category
  ORDER BY vote_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function 4: MPs who changed clubs (when historical data available)
CREATE OR REPLACE FUNCTION get_party_switchers(term_param INTEGER DEFAULT 10)
RETURNS TABLE (
  mp_id INTEGER,
  mp_name TEXT,
  club_changes INTEGER,
  current_club TEXT,
  previous_club TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH club_counts AS (
    SELECT 
      cm.mp_id,
      COUNT(*) as changes
    FROM club_memberships cm
    WHERE cm.term = term_param
    GROUP BY cm.mp_id
    HAVING COUNT(*) > 1
  )
  SELECT 
    m.id,
    m.name,
    cc.changes::INTEGER,
    cm_current.club_code as current_club,
    cm_prev.club_code as previous_club
  FROM club_counts cc
  JOIN mps m ON cc.mp_id = m.id
  LEFT JOIN club_memberships cm_current ON m.id = cm_current.mp_id AND cm_current.to_date IS NULL
  LEFT JOIN LATERAL (
    SELECT club_code 
    FROM club_memberships 
    WHERE mp_id = m.id AND to_date IS NOT NULL 
    ORDER BY to_date DESC 
    LIMIT 1
  ) cm_prev ON true
  ORDER BY cc.changes DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions for PostgREST
GRANT EXECUTE ON FUNCTION get_votes_by_category TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_club_members TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_category_breakdown TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_party_switchers TO anon, authenticated;

-- Test the functions
SELECT * FROM get_category_breakdown(10) LIMIT 5;
SELECT * FROM get_club_members('PiS') LIMIT 3;
