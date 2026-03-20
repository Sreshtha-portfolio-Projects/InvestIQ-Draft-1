# What You Need & What to Do - Complete Guide

This document answers: **"What do I need and what do I need to do to deploy InvestIQ with Docker on Oracle VPS?"**

## ✅ Things You Need to Get/Have

### 1. Oracle Cloud Account ⏱️ 5 minutes
- **What**: Free cloud hosting account
- **Why**: Provides free VPS server forever
- **Where**: [cloud.oracle.com](https://cloud.oracle.com)
- **Cost**: $0 (free tier)
- **What you'll get**: 
  - 1 free VPS with 1GB RAM
  - Public IP address
  - 200GB storage

### 2. Domain Name ⏱️ 5 minutes + $$
- **What**: A domain like `investiq.com` or `myapp.com`
- **Why**: Users need a URL to access your app
- **Where**: GoDaddy, Namecheap, Google Domains, any registrar
- **Cost**: ~$10-15/year
- **Alternative**: You can use IP address temporarily, but domain is recommended

### 3. Supabase Account & Project ⏱️ 10 minutes
- **What**: Database and authentication service
- **Why**: Stores user data, handles login/signup
- **Where**: [supabase.com](https://supabase.com)
- **Cost**: $0 (free tier - 500MB database)
- **What you'll get**:
  - PostgreSQL database URL
  - Service role key (secret)
  - Anon key (public)

### 4. Google Gemini API Key ⏱️ 2 minutes
- **What**: AI API for stock analysis
- **Why**: Powers the AI research assistant
- **Where**: [aistudio.google.com](https://aistudio.google.com)
- **Cost**: $0 (free tier - 15 requests/minute)
- **What you'll get**: API key like `AIzaSy...`

### 5. Finnhub API Key ⏱️ 2 minutes
- **What**: Stock market data API
- **Why**: Provides real-time stock prices and data
- **Where**: [finnhub.io](https://finnhub.io)
- **Cost**: $0 (free tier - 60 calls/minute)
- **What you'll get**: API key like `cv1...`

### 6. SSH Key Pair (if you don't have one) ⏱️ 1 minute
- **What**: Security key for connecting to your server
- **Why**: Secure authentication to VPS
- **How to create**:
  ```bash
  ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
  ```
- **What you'll get**: Public key (id_rsa.pub) and private key (id_rsa)

### 7. Git Repository Access ⏱️ 1 minute
- **What**: Access to your InvestIQ code
- **Why**: Need to clone code to server
- **How**: Clone your fork or the original repo
- **Alternative**: Upload files via SCP/SFTP

---

## 📝 Total Checklist of Things to Obtain

- [ ] Oracle Cloud account created
- [ ] Oracle VPS created and running
- [ ] VPS public IP address noted down
- [ ] Domain name purchased
- [ ] Domain DNS configured (A record → VPS IP)
- [ ] Supabase project created
- [ ] Supabase database schema applied (`schema.sql`)
- [ ] Supabase URL copied
- [ ] Supabase service role key copied
- [ ] Supabase anon key copied
- [ ] Gemini API key obtained
- [ ] Finnhub API key obtained
- [ ] SSH key pair generated
- [ ] Can SSH into VPS successfully

---

## 🔧 Things You Need to Do (Step-by-Step)

### Phase 1: Oracle Cloud Setup ⏱️ 15 minutes

#### Step 1.1: Create VPS Instance

1. Sign in to Oracle Cloud Console
2. Go to **Compute** → **Instances** → **Create Instance**
3. Configure:
   - **Name**: `investiq-server`
   - **Image**: Ubuntu 22.04
   - **Shape**: VM.Standard.E2.1.Micro (Always Free)
   - **Add SSH Keys**: Upload your public key (id_rsa.pub)
4. Click **Create**
5. **Note down the public IP address** - you'll need this!

#### Step 1.2: Configure Firewall

1. In Oracle Console: **Networking** → **Virtual Cloud Networks**
2. Select your VCN → **Security Lists** → **Default Security List**
3. Click **Add Ingress Rules** and add these 3 rules:

| Source CIDR | Protocol | Port | Description |
|-------------|----------|------|-------------|
| 0.0.0.0/0   | TCP      | 22   | SSH         |
| 0.0.0.0/0   | TCP      | 80   | HTTP        |
| 0.0.0.0/0   | TCP      | 443  | HTTPS       |

#### Step 1.3: Configure Domain DNS

1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS settings
3. Add A record:
   - **Host**: `@` (or leave blank)
   - **Points to**: Your VPS IP address
   - **TTL**: 3600 (or default)
4. Add A record for www (optional):
   - **Host**: `www`
   - **Points to**: Your VPS IP address
5. **Wait 5-10 minutes** for DNS to propagate
6. Verify: `nslookup yourdomain.com` should show your IP

### Phase 2: Server Setup ⏱️ 10 minutes

#### Step 2.1: Connect to VPS

```bash
# From your local computer
ssh ubuntu@your-vps-ip

# Example:
ssh ubuntu@129.146.123.456
```

#### Step 2.2: Update System

```bash
# Update packages
sudo apt update && sudo apt upgrade -y
```

#### Step 2.3: Configure UFW Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify
sudo ufw status
```

#### Step 2.4: Install Docker

```bash
# Download Docker install script
curl -fsSL https://get.docker.com -o get-docker.sh

# Run installation
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group change (or logout and login again)
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Phase 3: Application Setup ⏱️ 10 minutes

#### Step 3.1: Clone Repository

```bash
# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository
git clone https://github.com/yourusername/InvestIQ.git
cd InvestIQ

# Or if uploading manually:
# Create directory and use SCP to upload files
```

#### Step 3.2: Create Environment File

```bash
# Copy example file
cp .env.example .env

# Edit the file
nano .env
```

#### Step 3.3: Fill in Environment Variables

In the `.env` file, replace ALL placeholders with your actual values:

```env
# Replace yourdomain.com with your actual domain
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Replace with your Supabase values
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replace with your API keys
GEMINI_API_KEY=AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ123456
FINNHUB_API_KEY=cv1234567890abcdefghijklmn
```

**Important**:
- No trailing slashes in URLs
- No spaces around `=` signs
- No quotes around values
- Use HTTPS (not HTTP) for FRONTEND_URL and NEXT_PUBLIC_API_URL

Save: `Ctrl+O`, Enter, `Ctrl+X`

#### Step 3.4: Configure Nginx for Your Domain

```bash
# Edit Nginx configuration
nano nginx/conf.d/investiq.conf
```

Find and replace `yourdomain.com` in these 3 places:

1. Line ~7: `server_name yourdomain.com www.yourdomain.com;`
2. Line ~18: `server_name yourdomain.com www.yourdomain.com;`
3. Lines ~22-23: SSL certificate paths with `yourdomain.com`

Replace with your **actual domain**.

Save: `Ctrl+O`, Enter, `Ctrl+X`

### Phase 4: Deployment ⏱️ 5-10 minutes

#### Step 4.1: Make Scripts Executable

```bash
chmod +x deploy.sh ssl-setup.sh validate.sh
```

#### Step 4.2: Validate Configuration (Optional)

```bash
./validate.sh
```

Fix any errors shown.

#### Step 4.3: Deploy Application

```bash
./deploy.sh
```

This will:
- Build Docker images (takes 5-10 minutes first time)
- Start all containers
- Run health checks

**Wait for it to complete**. You'll see output showing build progress.

#### Step 4.4: Verify Deployment

```bash
# Check containers are running
docker compose ps

# All should show "Up" or "healthy"

# Test backend
curl http://localhost:4000/health
# Should return: {"status":"healthy"}

# Test frontend
curl http://localhost:3000
# Should return HTML
```

### Phase 5: SSL Setup ⏱️ 5 minutes

#### Step 5.1: Configure SSL Script

```bash
nano ssl-setup.sh
```

Update these 2 lines:

```bash
DOMAIN="yourdomain.com"  # Replace with your domain
EMAIL="you@example.com"  # Replace with your email
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

#### Step 5.2: Run SSL Setup

```bash
./ssl-setup.sh
```

This will:
- Request SSL certificate from Let's Encrypt
- Configure automatic renewal
- Reload Nginx with HTTPS

**Wait for it to complete** (~2 minutes).

### Phase 6: Verification ⏱️ 2 minutes

#### Step 6.1: Test HTTPS

Open in your browser:
```
https://yourdomain.com
```

You should see:
- ✅ Green lock icon (secure)
- ✅ InvestIQ homepage loads
- ✅ No errors in browser console

#### Step 6.2: Test Application

1. Click **Sign Up** → Create account
2. You should be redirected to Dashboard
3. Dashboard should show market data
4. Search for a stock (e.g., "TCS")
5. View stock details
6. Try AI Research tab
7. Try Screener with "Find undervalued IT stocks"

If everything works: **🎉 You're done!**

---

## 📊 Timeline Summary

| Phase | Tasks | Time |
|-------|-------|------|
| **Phase 1** | Oracle Cloud + Domain setup | 15 min |
| **Phase 2** | Server setup + Docker install | 10 min |
| **Phase 3** | Clone code + configuration | 10 min |
| **Phase 4** | Deploy application | 5-10 min |
| **Phase 5** | SSL setup | 5 min |
| **Phase 6** | Verification | 2 min |
| **Total** | | **~30-40 minutes** |

*First-time deployment may take longer due to Docker image builds*

---

## 🎯 Quick Reference Commands

### Check Status
```bash
docker compose ps                    # Container status
docker compose logs -f               # View logs
docker stats                         # Resource usage
```

### Restart Services
```bash
docker compose restart               # Restart all
docker compose restart backend       # Restart backend only
```

### Update Application
```bash
cd ~/apps/InvestIQ
git pull origin main
./deploy.sh
```

### View Logs
```bash
docker compose logs -f backend       # Backend logs
docker compose logs -f frontend      # Frontend logs
docker compose logs -f nginx         # Nginx logs
```

---

## ❌ What You DON'T Need

- ❌ Node.js installed on VPS (runs in Docker)
- ❌ npm installed on VPS (runs in Docker)
- ❌ Nginx installed on VPS (runs in Docker)
- ❌ Database server (using Supabase)
- ❌ Redis (not needed for basic setup)
- ❌ Load balancer (not needed for single server)
- ❌ CDN (optional, not required)

---

## 🆘 Common Issues & Quick Fixes

### Issue: Can't SSH to VPS
**Fix**: 
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa

# Try with verbose output
ssh -v ubuntu@your-vps-ip
```

### Issue: Containers won't start
**Fix**:
```bash
docker compose logs
docker compose down
docker compose up -d --force-recreate
```

### Issue: SSL certificate failed
**Fix**:
```bash
# Verify DNS
nslookup yourdomain.com
# Should show your VPS IP

# If DNS is correct, retry
./ssl-setup.sh
```

### Issue: CORS errors in browser
**Fix**:
```bash
# Check .env
grep FRONTEND_URL .env
# Should exactly match your domain (no trailing slash)

# Restart backend
docker compose restart backend
```

### Issue: Frontend shows "API unreachable"
**Fix**:
```bash
# Check backend health
curl http://localhost:4000/health

# Check .env
grep NEXT_PUBLIC_API_URL .env
# Should be https://yourdomain.com/api

# Rebuild frontend
docker compose up -d --build frontend
```

---

## 💰 Cost Breakdown

| Item | Cost |
|------|------|
| Oracle Cloud VPS | $0/month (Always Free) |
| Supabase | $0/month (Free tier) |
| Gemini API | $0/month (Free tier) |
| Finnhub API | $0/month (Free tier) |
| Domain | ~$10-15/year |
| SSL Certificate | $0 (Let's Encrypt) |
| **Total** | **~$1/month** (domain only) |

---

## 📚 Documentation Reference

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Full Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **All Docs**: [INDEX.md](INDEX.md)

---

## ✅ Final Checklist Before You Start

- [ ] I have an Oracle Cloud account
- [ ] I have a domain name (or am ready to buy one)
- [ ] I have a Supabase account and project
- [ ] I have a Gemini API key
- [ ] I have a Finnhub API key
- [ ] I have SSH keys set up
- [ ] I have 30-40 minutes available
- [ ] I'm ready to follow the steps above

**If all checked: You're ready to deploy!** 🚀

Start with **Phase 1: Oracle Cloud Setup** above.

---

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed explanations of each step.
