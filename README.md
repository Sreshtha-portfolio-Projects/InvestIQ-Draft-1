# InvestIQ — AI-Powered Stock Research Platform

A production-grade SaaS platform that combines Indian stock market data with OpenRouter AI to deliver institutional-quality investment research.

## Overview

InvestIQ is the "ChatGPT for Stock Research" — it interprets financial data using AI instead of just displaying raw numbers.

**Core Value Proposition:**
- Ask natural language questions about any stock
- Get AI-driven investment research, not just raw data
- Screen stocks using plain English descriptions
- Analyze earnings calls automatically with AI

---

## Features

| Feature | Description |
|---|---|
| **Market Dashboard** | Live NIFTY/SENSEX indices, top gainers/losers, trending stocks |
| **Stock Search** | Autocomplete search with real-time suggestions |
| **Company Overview** | Price chart, fundamental metrics, 52W high/low |
| **AI Research Assistant** | ChatGPT-style analysis of any Indian stock |
| **Natural Language Screener** | "Find undervalued IT stocks" → actual results |
| **Earnings Call Analyzer** | Upload transcript → AI extracts growth signals, risks, guidance |
| **Watchlist** | Save and track stocks with live price updates |
| **Authentication** | Supabase Auth with JWT protection |

---

## Tech Stack

### Frontend (`/frontend`)
- **Next.js 16** (App Router)
- **TypeScript**
- **TailwindCSS v4**
- **TanStack Query v5** (data fetching + caching)
- **Lucide React** (icons)
- Custom Canvas-based stock chart

### Backend (`/backend`)
- **Node.js + Express**
- **TypeScript**
- **Supabase** (PostgreSQL + Auth)
- **OpenRouter AI** (AI analysis with multiple model providers)
- **Finnhub API** (real-time market data)
- Rate limiting, CORS, Helmet security

---

## Project Structure

```
InvestIQ/
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/        # Login page
│   │   ├── (auth)/signup/       # Signup page
│   │   ├── dashboard/           # Market overview
│   │   ├── stocks/[ticker]/     # Stock detail page
│   │   ├── screener/            # AI natural language screener
│   │   └── watchlist/           # User watchlist
│   ├── components/
│   │   ├── ai/                  # ResearchAssistant, EarningsAnalyzer
│   │   ├── charts/              # StockChart (canvas-based)
│   │   ├── layout/              # Navbar
│   │   ├── stocks/              # StockSearchBar
│   │   └── ui/                  # Button, Card, Badge, Input, etc.
│   ├── hooks/                   # useStocks, useAuth, useDebounce
│   ├── services/                # API clients (stock, ai, watchlist, auth)
│   ├── types/                   # TypeScript interfaces
│   └── utils/                   # format, cn utilities
│
└── backend/
    └── src/
        ├── ai/
        │   ├── aiClient.ts              # OpenRouter AI wrapper
        │   ├── prompts.ts               # Centralized prompt templates
        │   ├── researchAssistant.ts     # AI research pipeline
        │   ├── screenerInterpreter.ts   # NL→filters→DB pipeline
        │   └── earningsAnalyzer.ts      # Transcript analysis
        ├── controllers/                 # Request handlers (no business logic)
        ├── db/
        │   ├── schema.sql               # Full PostgreSQL schema with RLS
        │   └── supabase.ts              # Supabase client singleton
        ├── market/
        │   ├── finnhubClient.ts         # Finnhub API wrapper (quotes, candles, metrics)
        │   └── marketDataService.ts     # Market data with caching + mock fallback
        ├── middleware/                  # auth, errorHandler, validate
        ├── routes/                      # Route definitions
        ├── services/                    # Business logic layer
        ├── types/                       # TypeScript interfaces
        └── utils/                       # logger, apiResponse helpers
```

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase account
- OpenRouter account (for AI API key — https://openrouter.ai/keys)
- Finnhub account (for market data API key — free tier available)

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `backend/src/db/schema.sql` in the Supabase SQL Editor
3. Copy your project URL and keys

### 3. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

OPENROUTER_API_KEY=your-openrouter-api-key
FINNHUB_API_KEY=your-finnhub-api-key
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 4. Get API Keys

| Service | URL | Notes |
|---|---|---|
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | Pay-as-you-go, supports multiple AI models |
| Finnhub | [finnhub.io](https://finnhub.io) | Free: 60 requests/minute |
| Supabase | [supabase.com](https://supabase.com) | Free tier available |

### 5. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Reference

### Authentication
```
POST /api/auth/signup      # Create account
POST /api/auth/signin      # Sign in
POST /api/auth/signout     # Sign out (protected)
GET  /api/auth/me          # Get current user (protected)
```

### Stocks
```
GET  /api/stocks/market         # Market dashboard (indices, gainers, losers)
GET  /api/stocks/search?q=TCS   # Search stocks
GET  /api/stocks/:ticker        # Stock detail with fundamentals
```

### AI
```
POST /api/ai/research           # AI investment research
POST /api/ai/screen             # Natural language screener
POST /api/ai/earnings/analyze   # Analyze earnings transcript
GET  /api/ai/earnings/:id       # Get cached earnings analysis
```

### Watchlist (protected)
```
GET    /api/watchlist           # Get user's watchlist
POST   /api/watchlist           # Add stock to watchlist
DELETE /api/watchlist/:id       # Remove stock from watchlist
```

---

## Architecture Decisions

**Clean Architecture:**
- Controllers handle HTTP only — no business logic
- Business logic lives in Services
- AI logic isolated in `/ai` module
- Database access only through Supabase service layer

**AI Pipeline (Research Assistant):**
```
User Question
    → Fetch company data (DB + Finnhub)
    → Build contextual prompt with financial metrics
    → OpenRouter AI API call
    → Parse structured JSON response
    → Return to frontend
```

**AI Pipeline (Stock Screener):**
```
Natural Language Query
    → OpenRouter AI interprets intent → structured filters
    → Database query with filters
    → Return matching companies with financials
```

**Caching Strategy:**
- Finnhub responses: in-memory cache, 5-minute TTL (prevents duplicate calls within the same session)
- AI analyses: Supabase `ai_analyses` table, 24-hour TTL
- Frontend queries: TanStack Query, 5-minute stale time

---

## Production Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel via CLI or GitHub integration
```

### Backend (Railway/Render)
```bash
cd backend
npm run build
npm start
```

Set all environment variables in your deployment platform.

---

## License

MIT
