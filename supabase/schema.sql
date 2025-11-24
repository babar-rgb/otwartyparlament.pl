-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Table: mps (Posłowie)
create table if not exists mps (
  id integer primary key, -- Matches Sejm API ID
  name text not null,
  party text,
  district text,
  photo_url text,
  active boolean default true,
  stats_attendance float default 0,
  stats_rebellion integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: votes (Głosowania)
create table if not exists votes (
  id integer primary key, -- Matches Sejm API ID if possible, or auto-increment if not unique enough (Sejm uses votingNumber + sitting, so we might need a composite or a surrogate. Let's use Sejm's votingNumber for now but it resets per sitting. Actually, Sejm API has no global ID for a vote, it's sitting + votingNumber. Let's use a composite key or just a serial ID and store metadata.)
  -- Wait, Sejm API doesn't have a unique global ID for a vote. It's sitting + votingNumber.
  -- Let's use a generated ID for internal use, and store sitting/voting_number as unique constraint.
  sitting integer not null,
  voting_number integer not null,
  date timestamp with time zone not null,
  title_raw text not null,
  title_clean text,
  category text,
  verdict text,
  details_json jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sitting, voting_number)
);

-- Table: vote_results (Wyniki Indywidualne)
create table if not exists vote_results (
  id uuid primary key default uuid_generate_v4(),
  vote_id integer references votes(id) on delete cascade, -- This needs to reference the internal ID of votes table.
  -- Wait, if we use serial for votes.id, we need to know it when inserting results.
  -- For ETL simplicity, maybe we can construct a deterministic ID? e.g. sitting * 10000 + voting_number? 
  -- Let's stick to Serial and let the ETL handle the lookup or return.
  mp_id integer references mps(id) on delete cascade,
  vote text not null, -- "ZA", "PRZECIW", "WSTRZYMAŁ", "BRAK"
  rebel boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table mps enable row level security;
alter table votes enable row level security;
alter table vote_results enable row level security;

-- Public Read Access
create policy "Allow public read access on mps" on mps for select using (true);
create policy "Allow public read access on votes" on votes for select using (true);
create policy "Allow public read access on vote_results" on vote_results for select using (true);

-- Service Role Write Access (Implicit, but good to be explicit if we wanted restricted user access later)
-- For now, we rely on the service role key bypassing RLS for the ETL script.
