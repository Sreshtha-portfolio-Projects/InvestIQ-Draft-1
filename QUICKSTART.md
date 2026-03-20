# InvestIQ - Docker + Oracle VPS Quick Start

This is a rapid deployment guide. For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## What You'll Need (5 minutes to gather)

- [ ] Oracle Cloud VPS (free tier works!)
- [ ] Domain name pointed to VPS IP
- [ ] Supabase account + API keys
- [ ] Gemini API key (free at aistudio.google.com)
- [ ] Finnhub API key (free at finnhub.io)

## Server Setup (10 minutes)

### 1. Create Oracle Cloud VPS

```bash
# Ubuntu 22.04, VM.Standard.E2.1.Micro (free tier)
# Open ports: 22, 80, 443
```

### 2. Install Docker

```bash
# SSH into your VPS
ssh ubuntu@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

## Application Deployment (10 minutes)

### 3. Clone & Configure

```bash
# Clone repository
git clone https://github.com/yourusername/InvestIQ.git
cd InvestIQ

# Create environment file
cp .env.example .env
nano .env
```

Paste your values:
```env
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
FINNHUB_API_KEY=cv1...
```

### 4. Update Nginx Config

```bash
nano nginx/conf.d/investiq.conf
```

Replace `yourdomain.com` with your actual domain (3 places).

### 5. Deploy

```bash
chmod +x deploy.sh ssl-setup.sh
./deploy.sh
```

Wait 2-3 minutes for build to complete.

### 6. Set Up SSL

```bash
nano ssl-setup.sh
# Update DOMAIN and EMAIL

./ssl-setup.sh
```

## Verify Deployment (2 minutes)

```bash
# Check containers
docker compose ps

# Test backend
curl https://yourdomain.com/health

# Test frontend
curl https://yourdomain.com
```

Open `https://yourdomain.com` in your browser!

## Common Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Update application
git pull origin main
./deploy.sh

# Stop everything
docker compose down
```

## Troubleshooting

**Containers won't start:**
```bash
docker compose logs
docker compose down
docker compose up -d --force-recreate
```

**SSL failed:**
```bash
# Verify DNS
nslookup yourdomain.com

# Should show your VPS IP
```

**CORS error:**
```bash
# Check .env file
grep FRONTEND_URL .env
# Should match your domain exactly (no trailing slash)

docker compose restart backend
```

## What's Running?

- **Backend API**: Internal port 4000
- **Frontend**: Internal port 3000  
- **Nginx**: Ports 80 (HTTP) → 443 (HTTPS)
- **Certbot**: Auto-renews SSL every 12 hours

## File Structure

```
InvestIQ/
├── backend/
│   ├── Dockerfile          # Backend container
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile          # Frontend container
│   └── .dockerignore
├── nginx/
│   ├── nginx.conf          # Main config
│   └── conf.d/
│       └── investiq.conf   # Site config
├── docker-compose.yml      # Orchestration
├── .env                    # Your secrets
├── .env.example            # Template
├── deploy.sh               # Deployment script
└── ssl-setup.sh            # SSL script
```

## Costs

**Oracle Cloud Free Tier (Always Free):**
- 2 VMs (1GB RAM each) - FREE
- 200GB storage - FREE
- 10TB bandwidth/month - FREE

**Other Services:**
- Supabase: Free tier (500MB DB)
- Gemini API: Free tier (15 req/min)
- Finnhub API: Free tier (60 req/min)
- Domain: ~$10-15/year

**Total: $0/month** (except domain)

## Next Steps

1. Set up [monitoring](https://uptimerobot.com) - Free
2. Configure [backups](DEPLOYMENT.md#backup-database)
3. Add [CI/CD](docker/README.md#cicd-integration) with GitHub Actions
4. Review [security best practices](DEPLOYMENT.md#security-best-practices)

## Need Help?

- **Detailed guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Docker details**: [docker/README.md](docker/README.md)
- **Local setup**: [SETUP.md](SETUP.md)

---

**Total setup time: ~25 minutes** ✨
