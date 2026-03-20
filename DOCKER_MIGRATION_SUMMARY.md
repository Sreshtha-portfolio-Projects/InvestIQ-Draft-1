# Docker + Oracle VPS Setup - Complete Summary

This document summarizes everything that has been changed for Docker + Oracle VPS deployment.

## What Was Removed

### Deleted Files
- ✗ `render.yaml` - Render Blueprint configuration (no longer needed)

### Updated References
- Updated `SETUP.md` - Removed Render/Vercel references
- Replaced `DEPLOYMENT.md` - Now focuses on Docker + Oracle VPS

## What Was Created

### Docker Configuration Files

1. **`docker-compose.yml`** (Root directory)
   - Orchestrates all services (backend, frontend, nginx, certbot)
   - Defines networks and health checks
   - Configures ports and environment variables

2. **`backend/Dockerfile`**
   - Multi-stage build for backend API
   - Node.js 20 Alpine base
   - Runs as non-root user (investiq:1001)
   - Exposes port 4000

3. **`backend/.dockerignore`**
   - Excludes unnecessary files from Docker build
   - Reduces image size and build time

4. **`frontend/Dockerfile`**
   - Multi-stage build for Next.js frontend
   - Uses standalone output mode
   - Build arguments for environment variables
   - Exposes port 3000

5. **`frontend/.dockerignore`**
   - Excludes unnecessary files from Docker build

### Nginx Configuration

6. **`nginx/nginx.conf`**
   - Main Nginx configuration
   - Gzip compression, worker processes, logging

7. **`nginx/conf.d/investiq.conf`**
   - Site-specific configuration
   - SSL/TLS settings
   - Reverse proxy rules for backend and frontend
   - Security headers (HSTS, X-Frame-Options, etc.)
   - HTTP → HTTPS redirect

### Environment & Scripts

8. **`.env.example`**
   - Template for production environment variables
   - Documents all required variables
   - To be copied to `.env` with actual values

9. **`deploy.sh`**
   - Main deployment script
   - Checks environment variables
   - Builds and starts containers
   - Runs health checks
   - Shows deployment status

10. **`ssl-setup.sh`**
    - SSL certificate setup script
    - Uses Let's Encrypt via Certbot
    - Configures automatic renewal
    - Domain and email configuration

11. **`validate.sh`**
    - Pre-deployment validation script
    - Checks Docker installation
    - Verifies environment variables
    - Tests container status
    - Checks SSL certificates

### Documentation

12. **`DEPLOYMENT.md`** (Replaced)
    - Complete Oracle VPS deployment guide
    - Step-by-step instructions
    - Troubleshooting section
    - Security best practices
    - Cost estimation

13. **`QUICKSTART.md`** (New)
    - Rapid deployment guide
    - 25-minute setup time
    - Common commands reference
    - Quick troubleshooting

14. **`docker/README.md`** (New)
    - Detailed Docker documentation
    - Architecture explanation
    - All Docker commands
    - Monitoring and debugging
    - CI/CD integration examples

### Configuration Updates

15. **`frontend/next.config.ts`**
    - Added `output: 'standalone'` for Docker optimization
    - Enables minimal production build

16. **`.gitignore`**
    - Added `certbot/` directory
    - Added `docker-volumes/`
    - Added temporary file patterns

## Environment Variables Required

### Production (.env file)

```env
# Frontend Configuration
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API Keys
GEMINI_API_KEY=AIzaSy...
FINNHUB_API_KEY=cv1...
```

## What You Need to Do

### 1. Prerequisites
- [ ] Oracle Cloud account (free tier available)
- [ ] Domain name with DNS access
- [ ] Supabase project with schema applied
- [ ] Gemini API key
- [ ] Finnhub API key

### 2. On Oracle Cloud VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Clone repository
git clone <your-repo-url>
cd InvestIQ
```

### 3. Configure Application

```bash
# Create environment file
cp .env.example .env
nano .env
# Fill in all your actual values

# Update Nginx configuration
nano nginx/conf.d/investiq.conf
# Replace 'yourdomain.com' with your actual domain (3 places)
```

### 4. Deploy

```bash
# Make scripts executable
chmod +x deploy.sh ssl-setup.sh validate.sh

# Optional: Validate before deploying
./validate.sh

# Deploy application
./deploy.sh

# Set up SSL (after DNS is pointing to your server)
nano ssl-setup.sh  # Update DOMAIN and EMAIL
./ssl-setup.sh
```

### 5. Verify Deployment

```bash
# Check containers
docker compose ps

# View logs
docker compose logs -f

# Test backend health
curl https://yourdomain.com/health

# Open in browser
https://yourdomain.com
```

## Architecture Overview

```
Internet (Port 443)
        ↓
[Nginx Container] (Port 80, 443)
        ↓
        ├─→ [Backend Container] (Port 4000) - /api/*
        └─→ [Frontend Container] (Port 3000) - /*
               ↓
        [Supabase] (External)
               ↓
        [Gemini API] (External)
        [Finnhub API] (External)
```

### Container Communication

All containers run on `investiq-network`:
- **External access**: Only Nginx (ports 80, 443)
- **Internal DNS**: Services use container names
  - `http://backend:4000` (backend API)
  - `http://frontend:3000` (frontend app)

### Security Features

1. **Containers**:
   - Run as non-root users
   - Minimal Alpine base images
   - No unnecessary packages

2. **Network**:
   - Isolated Docker network
   - Only Nginx exposed to internet
   - Reverse proxy for backend/frontend

3. **SSL/TLS**:
   - Let's Encrypt certificates
   - TLS 1.2/1.3 only
   - Strong ciphers
   - HSTS enabled
   - Security headers

## Common Commands

### Daily Operations

```bash
# View logs
docker compose logs -f

# Restart application
docker compose restart

# Stop application
docker compose down

# Update application
git pull origin main
./deploy.sh
```

### Monitoring

```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Health checks
curl https://yourdomain.com/health
```

### Troubleshooting

```bash
# View backend logs
docker compose logs backend -f

# View frontend logs
docker compose logs frontend -f

# Enter container shell
docker exec -it investiq-backend sh

# Rebuild everything
docker compose down
docker compose build --no-cache
docker compose up -d
```

## File Structure

```
InvestIQ/
├── backend/
│   ├── src/                      # Backend source code
│   ├── Dockerfile                # ← NEW: Backend Docker image
│   └── .dockerignore             # ← NEW: Docker ignore rules
├── frontend/
│   ├── app/                      # Frontend Next.js app
│   ├── Dockerfile                # ← NEW: Frontend Docker image
│   ├── .dockerignore             # ← NEW: Docker ignore rules
│   └── next.config.ts            # ← UPDATED: Added standalone output
├── nginx/
│   ├── nginx.conf                # ← NEW: Main Nginx config
│   └── conf.d/
│       └── investiq.conf         # ← NEW: Site configuration
├── docker/
│   └── README.md                 # ← NEW: Docker documentation
├── certbot/                      # ← NEW: SSL certificates (auto-created)
│   ├── conf/
│   └── www/
├── docker-compose.yml            # ← NEW: Service orchestration
├── .env.example                  # ← NEW: Environment template
├── .env                          # ← CREATE: Your actual values (not in git)
├── deploy.sh                     # ← NEW: Deployment script
├── ssl-setup.sh                  # ← NEW: SSL setup script
├── validate.sh                   # ← NEW: Validation script
├── DEPLOYMENT.md                 # ← REPLACED: Oracle VPS guide
├── QUICKSTART.md                 # ← NEW: Quick start guide
├── SETUP.md                      # ← UPDATED: Removed Render references
└── .gitignore                    # ← UPDATED: Added Docker entries
```

## Deployment Timeline

1. **VPS Setup** (10 min)
   - Create Oracle Cloud instance
   - Configure firewall
   - Install Docker

2. **Application Setup** (10 min)
   - Clone repository
   - Configure .env
   - Update Nginx config

3. **Initial Deploy** (5 min)
   - Run deploy.sh
   - Verify containers

4. **SSL Setup** (5 min)
   - Configure DNS
   - Run ssl-setup.sh
   - Verify HTTPS

**Total: ~30 minutes**

## Cost Breakdown

### Free Tier (Oracle Cloud)
- **Compute**: 2 VMs (1GB RAM) - FREE forever
- **Storage**: 200GB - FREE forever
- **Network**: 10TB/month - FREE forever

### External Services
- **Supabase**: Free tier (500MB DB)
- **Gemini**: Free tier (15 req/min)
- **Finnhub**: Free tier (60 req/min)
- **Domain**: ~$10-15/year

**Total Monthly Cost: $0** (excluding domain)

## Key Differences from Render/Vercel

| Aspect | Render/Vercel | Docker + Oracle VPS |
|--------|---------------|---------------------|
| **Cost** | Free tier limits | Completely free forever |
| **Control** | Limited | Full server access |
| **Configuration** | Platform-managed | You manage everything |
| **SSL** | Auto-managed | Manual setup (automated renewal) |
| **Deployment** | Git push | SSH + deploy script |
| **Scaling** | Auto-scale | Manual scaling |
| **Logs** | Platform UI | Docker logs |
| **Domain** | Provided | Bring your own |

## Next Steps

1. **Monitoring**: Set up [Uptime Robot](https://uptimerobot.com) (free)
2. **Backups**: Configure database backups in Supabase
3. **CI/CD**: Add GitHub Actions for auto-deploy
4. **Custom Domain**: Configure your domain (if not done)
5. **Analytics**: Add analytics if needed
6. **Performance**: Monitor and optimize

## Support Documents

- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md)
- **Full Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Docker Details**: See [docker/README.md](docker/README.md)
- **Local Development**: See [SETUP.md](SETUP.md)

## Troubleshooting Quick Reference

### Containers won't start
```bash
docker compose logs
docker compose down
docker compose up -d --force-recreate
```

### SSL certificate failed
```bash
nslookup yourdomain.com  # Verify DNS
./ssl-setup.sh           # Retry
```

### CORS errors
```bash
grep FRONTEND_URL .env   # Check matches domain
docker compose restart backend
```

### Can't access application
```bash
docker compose ps        # Check all running
sudo ufw status         # Check firewall
curl http://localhost:4000/health  # Test backend
```

---

## Summary

✅ **Removed**: Render-specific configuration (render.yaml)

✅ **Created**: Complete Docker + Oracle VPS deployment setup
- 11 new files (Docker, Nginx, scripts)
- 4 new documentation files
- Updated configuration files

✅ **Ready to deploy**: Full production-ready setup with SSL, monitoring, and security

✅ **Cost**: $0/month (free tier) + domain cost

✅ **Time**: ~30 minutes from zero to production

---

**You're all set!** Follow [QUICKSTART.md](QUICKSTART.md) to deploy in 25 minutes.
