-- Create a View for Health Votes
-- This acts like a virtual table "baza_zdrowie" without duplicating data.

create or replace view view_health_votes as
select 
    v.id as vote_id,
    v.sitting,
    v.voting_number,
    v.date,
    v.title_clean,
    v.title_raw,
    v.category,
    a.summary as ai_summary,
    a.pros as ai_pros,
    a.cons as ai_cons,
    a.created_at as analysis_date
from 
    votes v
left join 
    vote_analyses a on v.id = a.vote_id
where 
    -- Filter logic (same as Python script but in SQL)
    v.category = 'Zdrowie' 
    OR v.title_clean ILIKE '%zdrow%'
    OR v.title_clean ILIKE '%szpital%'
    OR v.title_clean ILIKE '%medy%'
    OR v.title_clean ILIKE '%lekar%'
    OR v.title_clean ILIKE '%pielęgniar%'
    OR v.title_clean ILIKE '%pacjen%'
    OR v.title_clean ILIKE '%leków%'
    OR v.title_clean ILIKE '%refundac%';

-- Grant access to public (or authenticated users as needed)
grant select on view_health_votes to anon, authenticated, service_role;

COMMENT ON VIEW view_health_votes IS 'Virtual table combining votes and AI analysis filtered for Health topics.';

-- 2. GOSPODARKA
create or replace view view_economy_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Gospodarka' OR v.title_clean ILIKE ANY (ARRAY['%gospodark%', '%finans%', '%budżet%', '%podatk%', '%vat%', '%cit%', '%pit%', '%przedsiębiorc%', '%inflacj%']);

-- 3. ROLNICTWO
create or replace view view_agriculture_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Rolnictwo' OR v.title_clean ILIKE ANY (ARRAY['%rolnic%', '%wieś%', '%wsi%', '%zboż%', '%nawoz%', '%pasz%', '%arimir%', '%kowr%', '%roln%']);

-- 4. EDUKACJA
create or replace view view_education_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Edukacja' OR v.title_clean ILIKE ANY (ARRAY['%edukacj%', '%oświat%', '%szkoł%', '%uczelni%', '%nauczyciel%', '%uczniów%', '%student%', '%nauki%']);

-- 5. OBRONNOŚĆ
create or replace view view_defense_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Obronność' OR v.title_clean ILIKE ANY (ARRAY['%obron%', '%wojsk%', '%armi%', '%żołnierz%', '%wot%', '%nato%', '%granic%', '%bezpieczeństw%']);

-- 6. SPRAWIEDLIWOŚĆ
create or replace view view_justice_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Sprawiedliwość' OR v.title_clean ILIKE ANY (ARRAY['%sprawiedliwoś%', '%sąd%', '%trybunał%', '%prokuratur%', '%kodeks%karn%', '%krs%', '%więzien%']);

-- 7. INFRASTRUKTURA
create or replace view view_infrastructure_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Infrastruktura' OR v.title_clean ILIKE ANY (ARRAY['%infrastruktur%', '%dróg%', '%drogow%', '%kolej%', '%pociąg%', '%transport%', '%cpk%', '%autostrad%', '%mieszkani%']);

-- 8. ENERGETYKA
create or replace view view_energy_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Energetyka' OR v.title_clean ILIKE ANY (ARRAY['%energet%', '%węgiel%', '%węgl%', '%elektrown%', '%prąd%', '%gaz%', '%oze%', '%atom%', '%paliw%']);

-- 9. TECHNOLOGIA
create or replace view view_technology_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Technologia' OR v.title_clean ILIKE ANY (ARRAY['%technolog%', '%cyfryz%', '%internet%', '%innowac%', '%badani%', '%kosmicz%']);

-- 10. POLITYKA SPOŁECZNA
create or replace view view_social_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Polityka Społeczna' OR v.title_clean ILIKE ANY (ARRAY['%społeczn%', '%rodzin%', '%800+%', '%emeryt%', '%rent%', '%pomoc%', '%niepełnospraw%']);

-- 11. SPRAWY ZAGRANICZNE
create or replace view view_foreign_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Sprawy Zagraniczne' OR v.title_clean ILIKE ANY (ARRAY['%zagranic%', '%msz%', '%ukrain%', '%unia%', '%ue%', '%dyplomac%', '%ambasad%', '%europ%']);

-- 12. KULTURA
create or replace view view_culture_votes as
select v.id as vote_id, v.sitting, v.voting_number, v.date, v.title_clean, v.title_raw, v.category,
       a.summary as ai_summary, a.pros as ai_pros, a.cons as ai_cons, a.created_at as analysis_date
from votes v left join vote_analyses a on v.id = a.vote_id
where v.category = 'Kultura' OR v.title_clean ILIKE ANY (ARRAY['%kultur%', '%sztuk%', '%muze%', '%artys%', '%dziedzic%', '%medi%', '%tvp%', '%radio%']);

-- Grant access to all new views
GRANT SELECT ON view_economy_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_agriculture_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_education_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_defense_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_justice_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_infrastructure_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_energy_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_technology_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_social_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_foreign_votes TO anon, authenticated, service_role;
GRANT SELECT ON view_culture_votes TO anon, authenticated, service_role;
