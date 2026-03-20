# InvestIQ Docker Architecture

## Overview

InvestIQ uses a multi-container Docker architecture with Nginx as a reverse proxy.

## Production Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Port 80 & 443   │
                    │                   │
                    │   Oracle Cloud    │
                    │   VPS / Firewall  │
                    │                   │
                    └─────────┬─────────┘
                              │
                ┌─────────────▼─────────────┐
                │                           │
                │    Nginx Container        │
                │  (investiq-nginx)         │
                │                           │
                │  - SSL Termination        │
                │  - Reverse Proxy          │
                │  - Static File Caching    │
                │  - Security Headers       │
                │                           │
                └──┬──────────────────┬─────┘
                   │                  │
         ┌─────────▼────────┐    ┌───▼──────────────┐
         │                  │    │                  │
         │  Backend API     │    │  Frontend        │
         │  (Node.js)       │    │  (Next.js)       │
         │                  │    │                  │
         │  Port: 4000      │    │  Port: 3000      │
         │  (internal)      │    │  (internal)      │
         │                  │    │                  │
         └────┬──┬──┬───────┘    └──────────────────┘
              │  │  │
              │  │  └──────────────────────┐
              │  │                         │
              │  └─────────────┐           │
              │                │           │
         ┌────▼─────┐   ┌──────▼────┐   ┌─▼───────────┐
         │          │   │           │   │             │
         │ Supabase │   │  Gemini   │   │  Finnhub    │
         │ (Auth &  │   │   API     │   │     API     │
         │   DB)    │   │           │   │             │
         │          │   │           │   │             │
         └──────────┘   └───────────┘   └─────────────┘
       External Service  External API    External API
```

## Container Details

### 1. Nginx Container (investiq-nginx)

**Purpose**: Reverse proxy and SSL termination

- **Image**: `nginx:alpine`
- **Ports**: 
  - 80 (HTTP) → Redirects to HTTPS
  - 443 (HTTPS) → Main entry point
- **Volumes**:
  - `./nginx/nginx.conf` → `/etc/nginx/nginx.conf`
  - `./nginx/conf.d/` → `/etc/nginx/conf.d/`
  - `./certbot/conf/` → `/etc/letsencrypt/`
  - `./certbot/www/` → `/var/www/certbot/`
- **Routing**:
  - `/api/*` → `http://backend:4000/api/*`
  - `/health` → `http://backend:4000/health`
  - `/api-docs` → `http://backend:4000/api-docs`
  - `/*` → `http://frontend:3000/*`

### 2. Backend Container (investiq-backend)

**Purpose**: REST API server

- **Image**: Custom (Node.js 20 Alpine)
- **Internal Port**: 4000
- **External Access**: Only via Nginx
- **Build Strategy**: Multi-stage
  - Stage 1: Install prod dependencies
  - Stage 2: Build TypeScript → JavaScript
  - Stage 3: Minimal runtime (node_modules + dist)
- **User**: Non-root (investiq:1001)
- **Health Check**: `GET /health` every 30s
- **Environment**: From `.env` file

### 3. Frontend Container (investiq-frontend)

**Purpose**: Next.js application

- **Image**: Custom (Node.js 20 Alpine)
- **Internal Port**: 3000
- **External Access**: Only via Nginx
- **Build Strategy**: Multi-stage
  - Stage 1: Install all dependencies
  - Stage 2: Build Next.js (standalone output)
  - Stage 3: Minimal runtime with standalone server
- **User**: Non-root (nextjs:1001)
- **Health Check**: `GET /` every 30s
- **Build Args**: Environment variables baked in

### 4. Certbot Container (investiq-certbot)

**Purpose**: SSL certificate management

- **Image**: `certbot/certbot`
- **Function**: Automatic renewal every 12 hours
- **Volumes**: Shared with Nginx for certificates
- **Mode**: Background daemon

## Network Architecture

### Docker Network

All containers on `investiq-network` (bridge driver):

```
investiq-network (172.18.0.0/16)
├── nginx      (172.18.0.2)
├── backend    (172.18.0.3)
├── frontend   (172.18.0.4)
└── certbot    (172.18.0.5)
```

### Internal DNS

Docker provides DNS resolution by service name:
- `backend` → resolves to backend container IP
- `frontend` → resolves to frontend container IP

### Port Mapping

```
Host          Container       Service
──────────────────────────────────────────
80     →      80             Nginx (HTTP)
443    →      443            Nginx (HTTPS)
N/A    →      4000           Backend (internal only)
N/A    →      3000           Frontend (internal only)
```

## Request Flow

### User Request Flow

1. **User** → `https://yourdomain.com/`
2. **Nginx** (443) → TLS termination → Proxy to Frontend
3. **Frontend** (3000) → Returns HTML/JS
4. **User** receives page

### API Request Flow

1. **User Browser** → `https://yourdomain.com/api/stocks/market`
2. **Nginx** (443) → TLS termination → Proxy to `/api/*`
3. **Backend** (4000) → Process request
4. **Backend** → Query Supabase / Call APIs
5. **Backend** → Return JSON response
6. **Nginx** → Forward to user
7. **User** receives data

### Static Asset Flow

1. **User** → `https://yourdomain.com/_next/static/...`
2. **Nginx** → Check cache
3. If cached: Return immediately
4. If not cached: Forward to Frontend → Cache → Return

## Data Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ HTTPS (443)
     │
┌────▼────────────────────────────┐
│         Nginx Reverse Proxy      │
│  - SSL/TLS Termination          │
│  - Request Routing              │
│  - Header Management            │
└────┬────────────────┬───────────┘
     │                │
     │ HTTP (4000)    │ HTTP (3000)
     │                │
┌────▼─────┐    ┌─────▼────────┐
│ Backend  │    │   Frontend   │
│   API    │◄───┤   Next.js    │
└────┬─────┘    └──────────────┘
     │
     ├────► Supabase (Auth & Database)
     ├────► Gemini API (AI Analysis)
     └────► Finnhub API (Market Data)
```

## Security Layers

### Layer 1: Firewall (Oracle Cloud + UFW)

```
Internet
   │
   ▼
┌──────────────────┐
│  Oracle Cloud    │
│  Security List   │
│  - Port 22, 80,  │
│    443 only      │
└────────┬─────────┘
         │
┌────────▼─────────┐
│   UFW Firewall   │
│   on VPS         │
└────────┬─────────┘
         │
    Docker Host
```

### Layer 2: Nginx Reverse Proxy

- Only Nginx exposed to internet
- Backend/frontend on private Docker network
- Security headers on all responses
- Rate limiting (if configured)

### Layer 3: Container Isolation

- Non-root users in all containers
- Read-only filesystem where possible
- Minimal attack surface (Alpine Linux)
- No SSH in containers

### Layer 4: Application Security

- JWT authentication (Supabase)
- Input validation (Zod)
- CORS configured
- Helmet.js security headers
- Rate limiting on API

## Volume Persistence

### SSL Certificates

```
Host: ./certbot/conf
Container (nginx): /etc/letsencrypt (read-only)
Container (certbot): /etc/letsencrypt (read-write)
```

### Nginx Configuration

```
Host: ./nginx/
Container: /etc/nginx/ (read-only)
```

### No Database Volumes

Database is external (Supabase) - no local persistence needed.

## Build Process

### Backend Build

```
1. Base image (node:20-alpine)
2. Install dependencies (npm ci --only=production)
3. Copy source code
4. Build TypeScript (npm run build)
5. Create minimal runtime image
   - Copy dist/
   - Copy node_modules/
   - No source files
```

### Frontend Build

```
1. Base image (node:20-alpine)
2. Install all dependencies (npm ci)
3. Copy source code
4. Build Next.js with standalone output
5. Create minimal runtime image
   - Copy .next/standalone/
   - Copy .next/static/
   - Copy public/
```

## Deployment Process

```
1. Git Pull
   ↓
2. Validate Environment (.env)
   ↓
3. Build Images
   ├─ Backend Dockerfile
   └─ Frontend Dockerfile
   ↓
4. Start Containers
   ├─ Create Network
   ├─ Start Backend
   ├─ Start Frontend
   ├─ Start Nginx
   └─ Start Certbot
   ↓
5. Health Checks
   ├─ Backend: /health endpoint
   └─ Frontend: / endpoint
   ↓
6. SSL Setup (if first time)
   ├─ Request certificate
   └─ Reload Nginx
   ↓
7. Verification
   ├─ Test HTTPS
   ├─ Test API
   └─ Test Frontend
```

## Scaling Strategy

### Vertical Scaling (Single Server)

Current setup supports:
- Small-Medium traffic (1000s of users)
- 1GB RAM sufficient for free tier
- Upgrade VPS instance if needed

### Horizontal Scaling (Future)

To scale horizontally:

1. **Add Load Balancer**:
   ```
   Internet → Load Balancer → [Nginx1, Nginx2, Nginx3]
   ```

2. **Multiple Backend Instances**:
   ```
   docker-compose.yml:
     backend:
       deploy:
         replicas: 3
   ```

3. **Redis for Session/Cache**:
   - Add Redis container
   - Share cache across instances

4. **Database Connection Pooling**:
   - Already using Supabase (handles this)

## Monitoring Points

### Container Health

- Docker health checks (30s interval)
- Container restart on failure
- Auto-restart policy: `unless-stopped`

### Application Health

- Backend: `GET /health` endpoint
- Frontend: Home page accessibility
- Response time monitoring

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Memory per container
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Disk usage
docker system df
```

### Logs

```bash
# All containers
docker compose logs -f

# Specific container
docker compose logs -f backend

# With timestamps
docker compose logs -f -t
```

## Backup Strategy

### What to Backup

1. **Environment Variables** (`.env`)
   - Backup securely
   - Store in password manager

2. **SSL Certificates** (`./certbot/conf/`)
   - Backup before renewal
   - Auto-backed up by certbot

3. **Nginx Configuration** (`./nginx/`)
   - Version controlled in Git

4. **Database**
   - Supabase handles backups
   - Point-in-time recovery available

### What NOT to Backup

- Docker images (rebuild from Dockerfile)
- Container data (ephemeral)
- node_modules (rebuilt on deploy)
- Build artifacts (rebuilt on deploy)

## Disaster Recovery

### Scenario 1: Container Failure

**Recovery**: Automatic (Docker restart policy)

### Scenario 2: Server Failure

**Recovery**:
1. Provision new VPS
2. Install Docker
3. Clone repository
4. Restore `.env` from backup
5. Run `./deploy.sh`
6. Restore SSL certificates or run `./ssl-setup.sh`

**Time**: ~15-20 minutes

### Scenario 3: Database Corruption

**Recovery**:
- Supabase handles this
- Point-in-time recovery available
- Restore from Supabase dashboard

---

## Summary

This architecture provides:

✅ **Security**: Multi-layer protection  
✅ **Scalability**: Can scale vertically or horizontally  
✅ **Reliability**: Auto-restart, health checks  
✅ **Performance**: Nginx caching, optimized builds  
✅ **Maintainability**: Clear separation of concerns  
✅ **Cost**: $0/month on Oracle Free Tier  

For deployment, see [DEPLOYMENT.md](../DEPLOYMENT.md)
