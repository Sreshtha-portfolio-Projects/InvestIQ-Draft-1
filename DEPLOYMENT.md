# InvestIQ — Deploy on Render + Vercel

This guide walks you through deploying InvestIQ to production:

- **Backend (API)** → [Render](https://render.com) — Node.js Web Service  
- **Frontend** → [Vercel](https://vercel.com) — Next.js

You should already have:

- A Supabase project (database + auth)
- Gemini API key
- Finnhub API key  
- The database schema applied in Supabase (see [SETUP.md](SETUP.md))

---

## Overview

| Component | Host    | URL you get                         |
|----------|---------|-------------------------------------|
| Backend  | Render  | `https://investiq-api.onrender.com` (example) |
| Frontend | Vercel  | `https://investiq.vercel.app` (example)       |

After deployment you will:

1. Set the backend’s `FRONTEND_URL` to your Vercel URL (for CORS).
2. Set the frontend’s `NEXT_PUBLIC_API_URL` to your Render API URL.

---

## Part 1: Deploy Backend on Render

### 1.1 Create a Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in (or sign up with GitHub).
2. Click **New** → **Web Service**.
3. Connect your GitHub account if needed, then select the **InvestIQ** repository.
4. Configure the service:

| Field | Value |
|-------|--------|
| **Name** | `investiq-api` (or any name you like) |
| **Region** | Choose one close to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or paid for always-on) |

5. Click **Advanced** and add the environment variables below.

### 1.2 Backend Environment Variables on Render

In **Environment** (or **Environment Variables**), add:

| Key | Value | Notes |
|-----|--------|--------|
| `PORT` | `4000` | Render sets this automatically; you can leave it. |
| `NODE_ENV` | `production` | |
| `FRONTEND_URL` | `https://your-app.vercel.app` | **Set this after deploying the frontend.** Use your real Vercel URL, no trailing slash. |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | From Supabase → Settings → API (service_role) |
| `SUPABASE_ANON_KEY` | `eyJ...` | From Supabase → Settings → API (anon public) |
| `GEMINI_API_KEY` | `AIzaSy...` | From [aistudio.google.com](https://aistudio.google.com) |
| `FINNHUB_API_KEY` | `cv1...` | From [finnhub.io](https://finnhub.io) |

For the first deploy you can set `FRONTEND_URL` to `https://your-app.vercel.app` (replace with the Vercel URL you’ll use), or use a placeholder and update it after the frontend is live.

### 1.3 Deploy

Click **Create Web Service**. Render will build and deploy. When it’s done, note your backend URL, e.g.:

```text
https://investiq-api.onrender.com
```

Use this as the base for the API (e.g. `https://investiq-api.onrender.com/api` for your API routes).

### 1.4 (Optional) Render Blueprint — `render.yaml`

The repo includes a **Blueprint** at the root: `render.yaml`. You can use it to define the backend service as code:

1. In Render dashboard: **New** → **Blueprint**.
2. Connect the same repo; Render will detect `render.yaml`.
3. Add the same environment variables in the Render UI (Blueprint does not store secrets).
4. Deploy.

This keeps service config in version control.

---

## Part 2: Deploy Frontend on Vercel

### 2.1 Import the Project

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New** → **Project**.
3. Import the **InvestIQ** repository.
4. Configure the project:

| Field | Value |
|-------|--------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `frontend` — click **Edit** and set to `frontend`. |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | (leave default) |
| **Install Command** | `npm install` (default) |

### 2.2 Frontend Environment Variables on Vercel

In **Environment Variables**, add:

| Key | Value | Environment |
|-----|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon only) | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://investiq-api.onrender.com/api` | Production, Preview, Development |

Use your **actual** Render backend URL (with `/api` at the end). Example:

```text
NEXT_PUBLIC_API_URL=https://investiq-api.onrender.com/api
```

### 2.3 Deploy

Click **Deploy**. When the build finishes, Vercel will show your frontend URL, e.g.:

```text
https://investiq-xxxx.vercel.app
```

(or your custom domain if you added one).

---

## Part 3: Connect Frontend and Backend

### 3.1 Set Backend CORS (FRONTEND_URL)

1. In **Render** → your backend service → **Environment**.
2. Set **FRONTEND_URL** to your **exact** Vercel app URL, **no trailing slash**:

   ```text
   https://investiq-xxxx.vercel.app
   ```

   If you use a custom domain for the frontend, use that instead.

3. Save. Render will redeploy with the new env.

### 3.2 (Optional) Vercel config

If you use a custom domain or need rewrites, you can add `frontend/vercel.json`. For a standard Next.js app with root directory `frontend`, the default settings are usually enough.

---

## Part 4: Verify Production

### 4.1 Backend

- Health: open `https://your-backend.onrender.com/health` — should return `{"status":"healthy"}`.
- API docs: open `https://your-backend.onrender.com/api-docs` — Swagger UI should load.

### 4.2 Frontend

- Open your Vercel URL (e.g. `https://investiq-xxxx.vercel.app`).
- Sign up / sign in (Supabase auth).
- Use the dashboard, search, screener, and AI research — all should call the Render API.

### 4.3 If the frontend shows “network error” or CORS errors

- Confirm **FRONTEND_URL** on Render matches the Vercel URL exactly (no trailing slash).
- Confirm **NEXT_PUBLIC_API_URL** on Vercel is `https://your-backend.onrender.com/api`.
- Redeploy backend after changing **FRONTEND_URL**; redeploy frontend after changing **NEXT_PUBLIC_API_URL** if needed.

---

## Environment Variables Reference (Production)

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Render sets this) | `4000` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Allowed CORS origin (Vercel app URL) | `https://investiq.vercel.app` |
| `SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only) | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Anon key | Supabase → Settings → API |
| `GEMINI_API_KEY` | Google Gemini API key | aistudio.google.com |
| `FINNHUB_API_KEY` | Finnhub API key | finnhub.io |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key only | Supabase → Settings → API |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://investiq-api.onrender.com/api` |

---

## Free Tier Notes

### Render (backend)

- Free instances spin down after ~15 minutes of no traffic; the first request after that may take 30–60 seconds (cold start).
- For always-on, use a paid instance.

### Vercel (frontend)

- Generous free tier for Next.js; preview deployments for every push.

### Supabase / Gemini / Finnhub

- Use the same free tiers as in [SETUP.md](SETUP.md); no extra config for production.

---

## Quick Deployment Checklist

- [ ] Supabase project created and `schema.sql` applied  
- [ ] Render Web Service created, **Root Directory** = `backend`  
- [ ] All backend env vars set on Render (including `FRONTEND_URL` after frontend is live)  
- [ ] Backend deploy successful; health URL returns `{"status":"healthy"}`  
- [ ] Vercel project created, **Root Directory** = `frontend`  
- [ ] All frontend env vars set on Vercel (`NEXT_PUBLIC_API_URL` = Render API URL + `/api`)  
- [ ] Frontend deploy successful  
- [ ] **FRONTEND_URL** on Render set to exact Vercel URL (no trailing slash)  
- [ ] Sign up / sign in and main flows work on production URL  

---

## Optional: Custom Domains

- **Vercel:** Project → Settings → Domains → add your domain and follow DNS instructions.
- **Render:** Service → Settings → Custom Domain → add domain and point DNS as shown.
- After adding a custom domain for the frontend, set **FRONTEND_URL** on Render to that domain (e.g. `https://app.investiq.com`).
