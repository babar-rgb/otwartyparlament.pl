-- Add importance_score and is_key_vote columns to votes table if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'votes' and column_name = 'importance_score') then
    alter table votes add column importance_score integer default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'votes' and column_name = 'is_key_vote') then
    alter table votes add column is_key_vote boolean default false;
  end if;
end $$;
