-- InvestIQ Database Schema

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sector TEXT,
  market_cap BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_ticker ON public.companies(ticker);
CREATE INDEX idx_companies_sector ON public.companies(sector);

-- Financials table
CREATE TABLE IF NOT EXISTS public.financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER,
  pe_ratio DECIMAL(10, 2),
  eps DECIMAL(10, 2),
  revenue_growth DECIMAL(10, 2),
  roe DECIMAL(10, 2),
  debt_to_equity DECIMAL(10, 2),
  current_ratio DECIMAL(10, 2),
  profit_margin DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, year, quarter)
);

CREATE INDEX idx_financials_company_id ON public.financials(company_id);
CREATE INDEX idx_financials_year ON public.financials(year);

-- Watchlists table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX idx_watchlists_company_id ON public.watchlists(company_id);

-- Enable RLS
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Watchlist policies
CREATE POLICY "Users can view their own watchlists"
  ON public.watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlists"
  ON public.watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists"
  ON public.watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Earnings transcripts table
CREATE TABLE IF NOT EXISTS public.earnings_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  transcript_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, quarter, year)
);

CREATE INDEX idx_earnings_company_id ON public.earnings_transcripts(company_id);
CREATE INDEX idx_earnings_year ON public.earnings_transcripts(year);

-- AI Analysis Cache table (optional - for caching AI responses)
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  analysis_type TEXT NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ai_cache_key ON public.ai_analysis_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON public.ai_analysis_cache(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for companies updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - for development)
-- INSERT INTO public.companies (ticker, name, sector, market_cap) VALUES
-- ('RELIANCE', 'Reliance Industries Ltd', 'Energy', 1500000000000),
-- ('TCS', 'Tata Consultancy Services', 'IT', 1200000000000),
-- ('HDFCBANK', 'HDFC Bank Ltd', 'Banking', 1000000000000),
-- ('INFY', 'Infosys Ltd', 'IT', 800000000000),
-- ('TATAMOTORS', 'Tata Motors Ltd', 'Automotive', 300000000000);
