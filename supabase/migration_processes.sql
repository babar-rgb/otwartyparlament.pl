-- Table: processes (Procesy Legislacyjne / Projekty Ustaw)
create table if not exists processes (
  id text primary key, -- Matches Sejm API Process ID (e.g. "1", "123")
  ue boolean default false,
  title text not null,
  description text,
  print_number text, -- Numer druku (documentId)
  process_start_date date,
  change_date timestamp with time zone,
  status text, -- "processing", "passed", "rejected", "closed"
  stages_json jsonb default '[]'::jsonb, -- Store the full timeline stages
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table processes enable row level security;
create policy "Allow public read access on processes" on processes for select using (true);
