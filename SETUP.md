# InvestIQ — Complete Setup Guide

Follow this guide end-to-end to get InvestIQ running locally in under 15 minutes.

> **Deploying to production?** See **[DEPLOYMENT.md](DEPLOYMENT.md)** for deploying with **Docker on Oracle VPS** or any cloud provider.

---

## Step 1: Get Your API Keys

You need three free accounts. All have generous free tiers.

---

### 1.1 — Google Gemini API Key

Gemini powers all AI features: research assistant, stock screener, earnings analyzer.

1. Go to **[aistudio.google.com](https://aistudio.google.com)**
2. Sign in with your Google account
3. Click **"Get API key"** in the top-left sidebar
4. Click **"Create API key"**
5. Select **"Create API key in new project"** (or pick an existing project)
6. Copy the key — it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

> **Free tier:** 15 requests/minute, 1 million tokens/day — more than enough for development.

---

### 1.2 — Finnhub API Key

Finnhub provides real-time stock quotes, company profiles, OHLCV candles, and financial metrics.

1. Go to **[finnhub.io](https://finnhub.io)** and click **"Get free API key"**
2. Sign up with your email (or continue with Google)
3. After email verification, you land on your **Dashboard**
4. Your API key is displayed immediately under **"API Key"** — it looks like: `cv1abc2ad3i6rxxxxxxxx`
5. Copy it

> **Free tier:** 60 API calls/minute, with access to:
> - Real-time quotes (`/quote`)
> - Company profiles (`/stock/profile2`)
> - Price candles / OHLCV history (`/stock/candle`)
> - Symbol search (`/search`)
> - Financial metrics (`/stock/metric`) — PE, EPS, 52W high/low, ROE, beta
>
> This is more than enough for development and testing.

> **Indian stocks:** Finnhub supports NSE-listed stocks using the `NSE:TICKER` symbol format (e.g. `NSE:TCS`, `NSE:RELIANCE`). The app handles this prefix automatically — you just use the bare ticker like `TCS`.

> **Upgrade tip:** The $50/month plan unlocks Websocket real-time streaming, earnings calendars, and higher rate limits.

---

### 1.3 — Supabase Project

Supabase provides the PostgreSQL database and authentication system.

1. Go to **[supabase.com](https://supabase.com)** and sign up (free)
2. Click **"New project"**
3. Fill in:
   - **Project name:** `investiq` (or anything you like)
   - **Database password:** Choose a strong password and **save it somewhere**
   - **Region:** Choose the region closest to you
4. Click **"Create new project"** — takes about 30 seconds to provision
5. Once ready, go to **Project Settings → API** (left sidebar)
6. Copy these three values:

| Value | Where to find it | Used in |
|---|---|---|
| **Project URL** | Settings → API → "Project URL" | Both backend and frontend |
| **anon / public key** | Settings → API → "Project API keys" → `anon public` | Frontend only |
| **service_role key** | Settings → API → "Project API keys" → `service_role secret` | Backend only |

> **Important:** The `service_role` key bypasses Row Level Security. Never expose it in frontend code.

---

## Step 2: Set Up the Database

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `backend/src/db/schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** (or press `Ctrl+Enter`)

You should see: `Success. No rows returned`

This creates all 7 tables, indexes, Row Level Security policies, and seeds 15 Indian stocks.

---

## Step 3: Configure Environment Variables

### Backend — create `backend/.env`

Create a new file at `backend/.env` (copy from `backend/.env.example`):

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase — from Step 1.3
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini — from Step 1.1
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Market Data — from Step 1.2
FINNHUB_API_KEY=cv1abc2ad3i6rxxxxxxxx
```

### Frontend — create `frontend/.env.local`

Create a new file at `frontend/.env.local` (copy from `frontend/.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

> Note: Only use the `anon` key in the frontend — never the `service_role` key.

---

## Step 4: Install Dependencies

Open two terminal windows.

**Terminal 1 — Backend:**
```bash
cd backend
npm install
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
```

---

## Step 5: Run the Development Servers

**Terminal 1 — Backend (runs on port 4000):**
```bash
cd backend
npm run dev
```

You should see:
```
[INFO] InvestIQ backend running on port 4000
[INFO] Environment: development
[INFO] Supabase client initialized
```

**Terminal 2 — Frontend (runs on port 3000):**
```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Step 6: Verify Everything Works

### Health check
```
GET http://localhost:4000/health
```
Should return: `{ "status": "healthy" }`

### API Documentation (Swagger)
Visit the interactive API documentation at:
```
http://localhost:4000/api-docs
```

The Swagger UI provides:
- Complete API reference for all endpoints
- Interactive "Try it out" feature to test endpoints
- Request/response examples
- Schema definitions
- Authentication support

See [`backend/SWAGGER.md`](backend/SWAGGER.md) for detailed usage instructions.

### Test the flow
1. Go to `http://localhost:3000/signup` → create an account
2. You'll land on the **Dashboard** — market indices and trending stocks should appear
3. Search for a stock (e.g., "TCS") in the top search bar
4. Go to `/screener` and try: `"Find undervalued IT companies"`
5. On a stock page, click **AI Research** tab and ask a question

---

## Common Issues

### "supabaseUrl is required"
Your `frontend/.env.local` file is missing or has the wrong key name.
Make sure it's named `.env.local` (not `.env`) and is inside the `frontend/` folder.

### "API limit reached" on Finnhub
The free tier allows 60 requests/minute — this is rarely hit during normal development. If it does happen, the app automatically falls back to realistic mock data so everything keeps working.

### Gemini "API key not valid"
Double-check the key in `backend/.env`. Make sure there are no extra spaces or quotes around it.

### Database tables not found
Make sure you ran the full `schema.sql` in Supabase SQL Editor. Check the **Table Editor** in Supabase — you should see tables named `companies`, `profiles`, `watchlists`, etc.

### CORS error in browser
Make sure `FRONTEND_URL=http://localhost:3000` is set in `backend/.env` exactly (no trailing slash).

### Port already in use
Change `PORT=4001` in `backend/.env` and update `NEXT_PUBLIC_API_URL=http://localhost:4001/api` in `frontend/.env.local`.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Where to get it |
|---|---|---|
| `PORT` | Backend server port | Set to `4000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin access) | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Public anon key | Supabase → Settings → API |
| `GEMINI_API_KEY` | Google Gemini API key | [aistudio.google.com](https://aistudio.google.com) |
| `FINNHUB_API_KEY` | Market data API key | [finnhub.io](https://finnhub.io) |

### Frontend (`frontend/.env.local`)

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key only | Supabase → Settings → API |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api` |

---

## Quick Start Checklist

- [ ] Created Gemini API key at aistudio.google.com
- [ ] Created Finnhub API key at finnhub.io
- [ ] Created Supabase project and copied URL + keys
- [ ] Ran `schema.sql` in Supabase SQL Editor
- [ ] Created `backend/.env` with all variables filled in
- [ ] Created `frontend/.env.local` with all variables filled in
- [ ] Ran `npm install` in both `backend/` and `frontend/`
- [ ] Started backend with `npm run dev` (port 4000)
- [ ] Started frontend with `npm run dev` (port 3000)
- [ ] Opened http://localhost:3000 and signed up


