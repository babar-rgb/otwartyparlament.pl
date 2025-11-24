-- Add new tables for Activity Data (Interpellations & Prints)
-- Run this if you already have the base schema (mps, votes, vote_results)

-- Table: interpellations (Interpelacje)
create table if not exists interpellations (
  id uuid primary key default uuid_generate_v4(),
  mp_id integer references mps(id) on delete cascade,
  num integer not null,
  title text not null,
  sent_to text,
  date date,
  link_sejm text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: prints (Druki Sejmowe)
create table if not exists prints (
  number text primary key,
  title text not null,
  description text,
  process_print_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add stats column to mps if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'mps' and column_name = 'stats_interpellations') then
    alter table mps add column stats_interpellations integer default 0;
  end if;
end $$;

-- RLS for new tables
alter table interpellations enable row level security;
alter table prints enable row level security;

-- Create policies only if they don't exist
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'interpellations' 
    and policyname = 'Allow public read access on interpellations'
  ) then
    execute 'create policy "Allow public read access on interpellations" on interpellations for select using (true)';
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'prints' 
    and policyname = 'Allow public read access on prints'
  ) then
    execute 'create policy "Allow public read access on prints" on prints for select using (true)';
  end if;
end $$;
