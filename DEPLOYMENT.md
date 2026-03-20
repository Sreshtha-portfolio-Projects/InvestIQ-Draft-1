# InvestIQ — Deploy on Oracle VPS with Docker

This guide walks you through deploying InvestIQ to production on an Oracle Cloud VPS (or any Linux VPS) using Docker.

**Architecture:**
- **Backend API** → Docker container (Node.js)
- **Frontend** → Docker container (Next.js)
- **Nginx** → Reverse proxy with SSL
- **Database** → Supabase (hosted)

---

## Prerequisites

Before you begin, you need:

- [ ] **Oracle Cloud VPS** (or any Linux VPS - Ubuntu 20.04/22.04 recommended)
- [ ] **Domain name** pointed to your VPS IP address
- [ ] **Supabase project** with database schema applied (see [SETUP.md](SETUP.md))
- [ ] **API Keys**: Gemini, Finnhub
- [ ] **SSH access** to your VPS

---

## Part 1: Set Up Oracle Cloud VPS

### 1.1 Create Oracle Cloud Instance

1. Go to [cloud.oracle.com](https://cloud.oracle.com) and sign in
2. Navigate to **Compute** → **Instances** → **Create Instance**
3. Configure:
   - **Name**: `investiq-server`
   - **Image**: Ubuntu 22.04
   - **Shape**: VM.Standard.E2.1.Micro (free tier) or better
   - **Network**: Create or select VCN
   - **Add SSH Keys**: Upload your public SSH key
4. Click **Create**

### 1.2 Configure Firewall Rules

In Oracle Cloud Console:

1. Go to **Networking** → **Virtual Cloud Networks**
2. Select your VCN → **Security Lists** → **Default Security List**
3. Add **Ingress Rules**:

| Source CIDR | Protocol | Port Range | Description |
|-------------|----------|------------|-------------|
| 0.0.0.0/0   | TCP      | 80         | HTTP        |
| 0.0.0.0/0   | TCP      | 443        | HTTPS       |
| 0.0.0.0/0   | TCP      | 22         | SSH         |

### 1.3 Configure UFW Firewall on VPS

SSH into your VPS and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Part 2: Install Docker on VPS

### 2.1 Install Docker Engine

```bash
# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2.2 Configure Docker Permissions

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group membership (or logout and login again)
newgrp docker

# Verify Docker works without sudo
docker ps
```

---

## Part 3: Deploy InvestIQ Application

### 3.1 Clone Repository on VPS

```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository (replace with your repo URL)
git clone https://github.com/yourusername/InvestIQ.git
cd InvestIQ

# Or if you're uploading files manually:
# Create the directory structure and upload files via SCP/SFTP
```

### 3.2 Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit environment file
nano .env
```

Set these values in `.env`:

```env
# Frontend URL - your domain or VPS IP
FRONTEND_URL=https://yourdomain.com

# Backend API URL - should point to your domain with /api path
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API Keys
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FINNHUB_API_KEY=cv1abc2ad3i6rxxxxxxxx
```

**Important:**
- Replace `yourdomain.com` with your actual domain
- Use the Supabase keys from your Supabase dashboard
- Never commit `.env` to git (it's already in `.gitignore`)

### 3.3 Configure Nginx for Your Domain

Edit the Nginx configuration:

```bash
nano nginx/conf.d/investiq.conf
```

Replace `yourdomain.com` with your actual domain in all locations (3 places).

### 3.4 Initial Deployment (HTTP Only)

First, deploy without SSL to verify everything works:

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will:
- Build Docker images for backend and frontend
- Start all containers
- Run health checks

**Verify deployment:**

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Test backend
curl http://localhost:4000/health

# Test frontend
curl http://localhost:3000
```

Access your application at `http://your-vps-ip:3000`

---

## Part 4: Set Up SSL with Let's Encrypt

### 4.1 Point Your Domain to VPS

Before setting up SSL, ensure your domain DNS is configured:

1. In your domain registrar (GoDaddy, Namecheap, etc.)
2. Add **A Record**:
   - **Host**: `@` (or your subdomain)
   - **Value**: Your VPS IP address
   - **TTL**: 3600
3. Add **A Record** for www:
   - **Host**: `www`
   - **Value**: Your VPS IP address
   - **TTL**: 3600

Wait 5-10 minutes for DNS propagation. Verify:

```bash
# Should show your VPS IP
nslookup yourdomain.com

# Or use ping
ping yourdomain.com
```

### 4.2 Obtain SSL Certificate

Edit the SSL setup script:

```bash
nano ssl-setup.sh
```

Update these lines with your actual values:
```bash
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"
```

Run the SSL setup:

```bash
# Make script executable
chmod +x ssl-setup.sh

# Run SSL setup
./ssl-setup.sh
```

This will:
- Request SSL certificate from Let's Encrypt
- Configure automatic renewal
- Reload Nginx with HTTPS

### 4.3 Verify SSL Configuration

Access your application at `https://yourdomain.com`

Check certificate:
```bash
# Should show certificate details
curl -vI https://yourdomain.com 2>&1 | grep -A 10 "SSL certificate"
```

---

## Part 5: Verify Production Deployment

### 5.1 Test Backend API

```bash
# Health check
curl https://yourdomain.com/health

# Should return: {"status":"healthy"}

# API documentation
# Open in browser: https://yourdomain.com/api-docs
```

### 5.2 Test Frontend

1. Open `https://yourdomain.com` in your browser
2. Sign up / sign in with Supabase auth
3. Test features:
   - Dashboard loads with market data
   - Stock search works
   - AI screener responds
   - Stock details page loads

### 5.3 Check Container Health

```bash
# View all containers
docker compose ps

# Should show all as "healthy" or "Up"

# Check logs for errors
docker compose logs backend | tail -50
docker compose logs frontend | tail -50
docker compose logs nginx | tail -50
```

---

## Part 6: Maintenance & Updates

### 6.1 View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Last 100 lines
docker compose logs --tail=100
```

### 6.2 Update Application

When you make code changes:

```bash
cd ~/apps/InvestIQ

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Verify
docker compose ps
```

Or use the deploy script:

```bash
./deploy.sh
```

### 6.3 Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### 6.4 Stop Services

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

### 6.5 Monitor Resource Usage

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Clean up unused images
docker image prune -a
```

---

## Troubleshooting

### Issue: Containers won't start

**Solution:**
```bash
# Check logs
docker compose logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|3000|4000)'

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Issue: SSL certificate failed

**Solution:**
```bash
# Verify domain points to VPS
nslookup yourdomain.com

# Check if port 80 is accessible
curl -I http://yourdomain.com

# Try manual certificate request
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  -d yourdomain.com \
  -d www.yourdomain.com
```

### Issue: "CORS error" in frontend

**Solution:**
```bash
# Verify FRONTEND_URL in .env matches your domain exactly
grep FRONTEND_URL .env

# Should be: FRONTEND_URL=https://yourdomain.com (no trailing slash)

# Restart backend
docker compose restart backend
```

### Issue: Frontend shows "API not reachable"

**Solution:**
```bash
# Check NEXT_PUBLIC_API_URL in .env
grep NEXT_PUBLIC_API_URL .env

# Should be: NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Rebuild frontend
docker compose up -d --build frontend
```

### Issue: Out of disk space

**Solution:**
```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Check log sizes
du -sh /var/lib/docker/containers/*/*-json.log
```

### Issue: Backend crashes / restarts frequently

**Solution:**
```bash
# Check backend logs
docker compose logs backend

# Common causes:
# 1. Invalid API keys in .env
# 2. Supabase connection issues
# 3. Out of memory

# Check container resources
docker stats investiq-backend
```

---

## Environment Variables Reference

### Backend (via .env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend port (internal) | `4000` |
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_URL` | CORS origin (your domain) | `https://yourdomain.com` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJ...` |
| `SUPABASE_ANON_KEY` | Anon public key | `eyJ...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `FINNHUB_API_KEY` | Finnhub API key | `cv1...` |

### Frontend (via .env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key only | `eyJ...` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://yourdomain.com/api` |

---

## Security Best Practices

### 1. Keep System Updated

```bash
# Update system packages regularly
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

### 2. Use Strong Passwords

- Supabase database password
- Oracle Cloud console password
- SSH key passphrase

### 3. Limit SSH Access

```bash
# Disable password authentication
sudo nano /etc/ssh/sshd_config

# Set: PasswordAuthentication no
# Restart SSH
sudo systemctl restart sshd
```

### 4. Monitor Logs

```bash
# Set up log rotation
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

### 5. Backup Database

Supabase provides automatic backups, but you can also:

```bash
# Export database via Supabase dashboard
# Or use pg_dump if you have direct database access
```

---

## Quick Deployment Checklist

- [ ] Oracle Cloud VPS created and configured
- [ ] Firewall rules set up (ports 80, 443, 22)
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS pointed to VPS IP
- [ ] Repository cloned on VPS
- [ ] `.env` file created with all API keys
- [ ] Nginx config updated with domain name
- [ ] Initial deployment successful (HTTP)
- [ ] SSL certificate obtained and configured
- [ ] HTTPS working and redirecting from HTTP
- [ ] Backend health check passes
- [ ] Frontend loads and authentication works
- [ ] All features tested (dashboard, screener, research)

---

## Cost Estimation

### Oracle Cloud Free Tier (Always Free)

- **Compute**: 2 VMs (1/8 OCPU, 1GB RAM each) — **FREE forever**
- **Storage**: 200GB block storage — **FREE forever**
- **Network**: 10TB outbound transfer/month — **FREE forever**

### Additional Services (Not Free)

- **Supabase**: Free tier (500MB database, 50,000 monthly active users)
- **Domain**: $10-15/year (varies by registrar)
- **Gemini API**: Free tier (15 req/min, 1M tokens/day)
- **Finnhub API**: Free tier (60 API calls/min)

**Total monthly cost**: $0 (if staying within free tiers) + domain cost

For production with higher traffic, consider:
- Supabase Pro: $25/month
- Oracle Cloud paid instance: ~$10-50/month
- Finnhub paid plan: $50-300/month

---

## Next Steps

1. **Set up monitoring**: Consider using tools like Uptime Robot for uptime monitoring
2. **Configure backups**: Set up automated database backups
3. **Add CI/CD**: Use GitHub Actions for automated deployments
4. **Custom domain**: Add your custom domain instead of using IP
5. **Email notifications**: Configure alerts for errors

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Oracle Cloud Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Need help?** Check the [main README](README.md) or [SETUP.md](SETUP.md) for local development setup.
