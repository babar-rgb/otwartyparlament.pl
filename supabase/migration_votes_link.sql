-- Add print_number column to votes table for linking with processes
alter table votes add column if not exists print_number text;

-- Create index for faster joins
create index if not exists idx_votes_print_number on votes(print_number);
