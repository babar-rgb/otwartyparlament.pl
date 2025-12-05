-- Bezpieczne włączenie RLS (Row Level Security)
-- Ten skrypt włącza zabezpieczenia, ale POZWALA na odczyt danych (SELECT) dla wszystkich,
-- co jest konieczne, aby strona internetowa działała poprawnie.

-- 1. Interpelacje
ALTER TABLE public.interpellations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.interpellations;
CREATE POLICY "Public Read Access" ON public.interpellations FOR SELECT USING (true);

-- 2. Autorzy Interpelacji
ALTER TABLE public.interpellation_authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.interpellation_authors;
CREATE POLICY "Public Read Access" ON public.interpellation_authors FOR SELECT USING (true);

-- 3. Analizy Głosowań (AI)
ALTER TABLE public.vote_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.vote_analyses;
CREATE POLICY "Public Read Access" ON public.vote_analyses FOR SELECT USING (true);

-- Informacja: Zapis (INSERT/UPDATE/DELETE) będzie teraz zablokowany dla publicznego API (anon),
-- co jest pożądanym stanem. Skrypty pythonowe (service_role) nadal będą miały dostęp.
