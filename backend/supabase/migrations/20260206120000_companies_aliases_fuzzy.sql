-- Companies: alias array + pg_trgm fuzzy search (run in Supabase SQL editor or migrate)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS aliases text[] DEFAULT '{}';

-- Trigram GIN for fuzzy / similarity on company name
CREATE INDEX IF NOT EXISTS companies_name_trgm
  ON public.companies USING gin (name gin_trgm_ops);

-- Fast ticker lookup
CREATE INDEX IF NOT EXISTS companies_ticker_idx
  ON public.companies (ticker);

-- GIN on text[] for alias containment / ops (supports array overlap queries)
CREATE INDEX IF NOT EXISTS companies_aliases_gin
  ON public.companies USING gin (aliases);

-- Fuzzy match on legal name + optional alias strings (typos like "infosis" → Infosys)
CREATE OR REPLACE FUNCTION public.fuzzy_search_companies(
  search_query text,
  result_limit int DEFAULT 5
)
RETURNS TABLE (
  ticker text,
  name text,
  score double precision
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT c.ticker::text,
         c.name::text,
         GREATEST(
           similarity(c.name, search_query),
           COALESCE(
             (
               SELECT MAX(similarity(a, search_query))
               FROM unnest(COALESCE(c.aliases, ARRAY[]::text[])) AS u(a)
             ),
             0::double precision
           )
         )::double precision AS score
  FROM public.companies c
  WHERE c.name % search_query
     OR EXISTS (
       SELECT 1
       FROM unnest(COALESCE(c.aliases, ARRAY[]::text[])) AS u(a)
       WHERE a % search_query
     )
  ORDER BY score DESC
  LIMIT GREATEST(COALESCE(result_limit, 5), 1);
$$;

COMMENT ON FUNCTION public.fuzzy_search_companies IS
  'Trigram fuzzy search on companies.name and companies.aliases; higher score = closer match.';

GRANT EXECUTE ON FUNCTION public.fuzzy_search_companies(text, int) TO anon, authenticated, service_role;
