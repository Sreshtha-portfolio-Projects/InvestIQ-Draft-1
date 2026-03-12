-- InvestIQ Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth, extended here for additional fields)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT UNIQUE NOT NULL,
  sector TEXT,
  industry TEXT,
  market_cap BIGINT,
  description TEXT,
  website TEXT,
  country TEXT DEFAULT 'IN',
  exchange TEXT DEFAULT 'NSE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial metrics table
CREATE TABLE IF NOT EXISTS public.financials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  pe_ratio DECIMAL(10, 2),
  eps DECIMAL(10, 4),
  revenue_growth DECIMAL(10, 2),
  roe DECIMAL(10, 2),
  debt_to_equity DECIMAL(10, 2),
  revenue BIGINT,
  net_income BIGINT,
  operating_margin DECIMAL(10, 2),
  gross_margin DECIMAL(10, 2),
  year INTEGER NOT NULL,
  quarter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlists table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Earnings transcripts table
CREATE TABLE IF NOT EXISTS public.earnings_transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  quarter TEXT NOT NULL,
  fiscal_year INTEGER,
  transcript_text TEXT,
  source_url TEXT,
  analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI analysis cache table
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('research', 'earnings', 'screener')),
  query TEXT,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON public.companies(ticker);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON public.companies(sector);
CREATE INDEX IF NOT EXISTS idx_financials_company_id ON public.financials(company_id);
CREATE INDEX IF NOT EXISTS idx_financials_year ON public.financials(year);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_company_id ON public.earnings_transcripts(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_company_id ON public.ai_analyses(company_id);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Watchlists: users can only manage their own watchlist
CREATE POLICY "Users can view own watchlist" ON public.watchlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to own watchlist" ON public.watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from own watchlist" ON public.watchlists FOR DELETE USING (auth.uid() = user_id);

-- Companies and financials: readable by all authenticated users
CREATE POLICY "Authenticated users can read companies" ON public.companies FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read financials" ON public.financials FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read transcripts" ON public.earnings_transcripts FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read analyses" ON public.ai_analyses FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Service role can do everything
CREATE POLICY "Service role full access companies" ON public.companies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access financials" ON public.financials FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access transcripts" ON public.earnings_transcripts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access analyses" ON public.ai_analyses FOR ALL USING (auth.role() = 'service_role');

-- Seed some Indian companies
INSERT INTO public.companies (name, ticker, sector, industry, exchange) VALUES
  ('Tata Consultancy Services', 'TCS', 'Technology', 'IT Services', 'NSE'),
  ('Infosys', 'INFY', 'Technology', 'IT Services', 'NSE'),
  ('HDFC Bank', 'HDFCBANK', 'Financial Services', 'Private Bank', 'NSE'),
  ('Reliance Industries', 'RELIANCE', 'Energy', 'Oil & Gas', 'NSE'),
  ('ICICI Bank', 'ICICIBANK', 'Financial Services', 'Private Bank', 'NSE'),
  ('Wipro', 'WIPRO', 'Technology', 'IT Services', 'NSE'),
  ('HCL Technologies', 'HCLTECH', 'Technology', 'IT Services', 'NSE'),
  ('Tata Motors', 'TATAMOTORS', 'Automobile', 'Auto Manufacturer', 'NSE'),
  ('Bharti Airtel', 'BHARTIARTL', 'Telecom', 'Telecom Services', 'NSE'),
  ('State Bank of India', 'SBIN', 'Financial Services', 'Public Bank', 'NSE'),
  ('Maruti Suzuki', 'MARUTI', 'Automobile', 'Passenger Vehicles', 'NSE'),
  ('Asian Paints', 'ASIANPAINT', 'Consumer', 'Paints', 'NSE'),
  ('Hindustan Unilever', 'HINDUNILVR', 'Consumer', 'FMCG', 'NSE'),
  ('Bajaj Finance', 'BAJFINANCE', 'Financial Services', 'NBFC', 'NSE'),
  ('Sun Pharma', 'SUNPHARMA', 'Healthcare', 'Pharmaceuticals', 'NSE')
ON CONFLICT (ticker) DO NOTHING;
