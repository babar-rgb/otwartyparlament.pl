-- PostgreSQL Views for "Intelligent Citizen Assistant"
-- These views power the user-centric experience endpoints.

-- =================================================================
-- FILAR 1: "The Pulse" - Highlights of the Week
-- =================================================================
CREATE OR REPLACE VIEW view_highlights_week AS
SELECT 
    v.id,
    v.title_clean as title,
    v.date,
    v.verdict,
    v.ux_category,
    v.importance_score,
    v.controversy_score,
    v.category,
    COALESCE(va.summary, 'Brak analizy') as ai_summary,
    v.details_json->>'yes' as votes_yes,
    v.details_json->>'no' as votes_no,
    v.details_json->>'abstain' as votes_abstain
FROM votes v
LEFT JOIN vote_analyses va ON v.id = va.vote_id
WHERE v.importance_score >= 70
  AND v.date > NOW() - INTERVAL '7 days'
ORDER BY v.importance_score DESC, v.controversy_score DESC
LIMIT 10;

-- =================================================================
-- FILAR 1B: Highlights of the Month
-- =================================================================
CREATE OR REPLACE VIEW view_highlights_month AS
SELECT 
    v.id,
    v.title_clean as title,
    v.date,
    v.verdict,
    v.ux_category,
    v.importance_score,
    v.controversy_score,
    v.category,
    COALESCE(va.summary, 'Brak analizy') as ai_summary,
    v.details_json->>'yes' as votes_yes,
    v.details_json->>'no' as votes_no,
    v.details_json->>'abstain' as votes_abstain
FROM votes v
LEFT JOIN vote_analyses va ON v.id = va.vote_id
WHERE v.importance_score >= 70
  AND v.date > NOW() - INTERVAL '30 days'
ORDER BY v.importance_score DESC, v.controversy_score DESC
LIMIT 20;

-- =================================================================
-- FILAR 2: Topic Clusters (For Farmers, Patients, etc.)
-- =================================================================

-- 🚜 Rolnictwo
CREATE OR REPLACE VIEW view_cluster_rolnictwo AS
SELECT 
    v.id, v.title_clean as title, v.date, v.verdict, 
    v.importance_score, v.controversy_score,
    va.summary as ai_summary
FROM votes v
LEFT JOIN vote_analyses va ON v.id = va.vote_id
WHERE v.ux_category LIKE '%Rolnictwo%'
ORDER BY v.date DESC
LIMIT 50;

-- 🏥 Zdrowie
CREATE OR REPLACE VIEW view_cluster_zdrowie AS
SELECT 
    v.id, v.title_clean as title, v.date, v.verdict,
    v.importance_score, v.controversy_score,
    va.summary as ai_summary
FROM votes v
LEFT JOIN vote_analyses va ON v.id = va.vote_id
WHERE v.ux_category LIKE '%Zdrowie%'
ORDER BY v.date DESC
LIMIT 50;

-- 💰 Podatki
CREATE OR REPLACE VIEW view_cluster_podatki AS
SELECT 
    v.id, v.title_clean as title, v.date, v.verdict,
    v.importance_score, v.controversy_score,
    va.summary as ai_summary
FROM votes v
LEFT JOIN vote_analyses va ON v.id = va.vote_id
WHERE v.ux_category LIKE '%Podatki%'
ORDER BY v.date DESC
LIMIT 50;

-- 🛡️ Bezpieczeństwo
CREATE OR REPLACE VIEW view_cluster_bezpieczenstwo AS
SELECT 
    v.id, v.title_clean as title, v.date, v.verdict,
    v.importance_score, v.controversy_score,
    va.summary as ai_summary
FROM votes v
LEFT JOIN vote_analyses va ON v.id = va.vote_id
WHERE v.ux_category LIKE '%Bezpieczeństwo%'
ORDER BY v.date DESC
LIMIT 50;

-- 🎓 Edukacja
CREATE OR REPLACE VIEW view_cluster_edukacja AS
SELECT 
    v.id, v.title_clean as title, v.date, v.verdict,
    v.importance_score, v.controversy_score,
    va.summary as ai_summary
FROM votes v
LEFT JOIN vote_analyses va ON v.id = va.vote_id
WHERE v.ux_category LIKE '%Edukacja%'
ORDER BY v.date DESC
LIMIT 50;

-- =================================================================
-- FILAR 2B: UX Categories Summary (for filter UI)
-- =================================================================
CREATE OR REPLACE VIEW view_ux_categories_summary AS
SELECT 
    ux_category,
    count(*) as total_votes,
    count(*) FILTER (WHERE date > NOW() - INTERVAL '30 days') as votes_this_month,
    round(avg(importance_score)) as avg_importance
FROM votes
WHERE ux_category IS NOT NULL
GROUP BY ux_category
ORDER BY total_votes DESC;

-- =================================================================
-- FILAR 3: Laws with TL;DR Summaries
-- =================================================================
CREATE OR REPLACE VIEW view_laws_with_tldr AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.ux_category,
    p.simple_summary->>'tldr' as tldr,
    p.simple_summary->>'what_changes' as what_changes,
    p.who_affected,
    p.simple_summary->'pros' as pros,
    p.simple_summary->'cons' as cons,
    p.process_start_date,
    p.status
FROM processes p
WHERE p.simple_summary IS NOT NULL
ORDER BY p.process_start_date DESC;

-- =================================================================
-- FILAR 4: Semantic Search Helper View
-- =================================================================
CREATE OR REPLACE VIEW view_search_all AS
SELECT 
    'vote' as type,
    v.id::text as id,
    v.title_clean as title,
    v.ux_category,
    NULL as content_preview,
    v.date,
    v.importance_score as relevance
FROM votes v
WHERE v.title_clean IS NOT NULL

UNION ALL

SELECT 
    'speech' as type,
    s.id::text,
    left(s.content, 100) as title,
    NULL as ux_category,
    left(s.content, 300) as content_preview,
    s.date,
    50 as relevance
FROM speeches s
WHERE s.content IS NOT NULL

UNION ALL

SELECT 
    'interpellation' as type,
    i.id::text,
    i.title,
    NULL as ux_category,
    left(i.content, 300) as content_preview,
    i.sent_date as date,
    40 as relevance
FROM interpellations i
WHERE i.title IS NOT NULL;

-- =================================================================
-- Grant access for PostgREST
-- =================================================================
GRANT SELECT ON view_highlights_week TO anon;
GRANT SELECT ON view_highlights_month TO anon;
GRANT SELECT ON view_cluster_rolnictwo TO anon;
GRANT SELECT ON view_cluster_zdrowie TO anon;
GRANT SELECT ON view_cluster_podatki TO anon;
GRANT SELECT ON view_cluster_bezpieczenstwo TO anon;
GRANT SELECT ON view_cluster_edukacja TO anon;
GRANT SELECT ON view_ux_categories_summary TO anon;
GRANT SELECT ON view_laws_with_tldr TO anon;
GRANT SELECT ON view_search_all TO anon;
