-- Add scoring columns to euro_votes
alter table euro_votes 
add column if not exists importance_score int default 0,
add column if not exists is_key_vote boolean default false;

-- Create index for faster sorting by importance
create index if not exists idx_euro_votes_importance on euro_votes(importance_score desc);
create index if not exists idx_euro_votes_is_key on euro_votes(is_key_vote);
