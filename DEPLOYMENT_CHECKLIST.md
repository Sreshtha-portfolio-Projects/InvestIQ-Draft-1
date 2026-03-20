# Docker + Oracle VPS Deployment Checklist

Use this checklist to ensure you have everything ready before deploying InvestIQ.

## ✅ Pre-Deployment Checklist

### 1. Prerequisites Gathered

- [ ] **Oracle Cloud Account** created (free tier available)
- [ ] **Domain name** purchased and accessible
- [ ] **Supabase Account** created
- [ ] **Gemini API Key** obtained from [aistudio.google.com](https://aistudio.google.com)
- [ ] **Finnhub API Key** obtained from [finnhub.io](https://finnhub.io)

### 2. Oracle Cloud VPS Setup

- [ ] VPS instance created (Ubuntu 22.04 recommended)
- [ ] SSH key configured for access
- [ ] Security list ingress rules added:
  - [ ] Port 22 (SSH)
  - [ ] Port 80 (HTTP)
  - [ ] Port 443 (HTTPS)
- [ ] UFW firewall configured on VPS
- [ ] Can SSH into VPS successfully

### 3. Domain Configuration

- [ ] Domain DNS A record created pointing to VPS IP
- [ ] DNS propagation verified (`nslookup yourdomain.com`)
- [ ] www subdomain A record created (optional but recommended)

### 4. Supabase Setup

- [ ] Supabase project created
- [ ] `schema.sql` executed in Supabase SQL Editor
- [ ] Database tables verified in Table Editor
- [ ] Supabase URL copied
- [ ] Service role key (secret) copied
- [ ] Anon key (public) copied

### 5. API Keys Ready

- [ ] **Gemini API Key** - looks like `AIzaSy...`
- [ ] **Finnhub API Key** - looks like `cv1...`
- [ ] All keys tested and working

## 🔧 Server Setup Checklist

### 1. Initial Server Configuration

- [ ] SSH into server: `ssh ubuntu@your-vps-ip`
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] UFW firewall enabled and configured
- [ ] Timezone set (optional): `sudo timedatectl set-timezone Your/Timezone`

### 2. Docker Installation

- [ ] Docker installed on VPS
- [ ] Docker service running: `sudo systemctl status docker`
- [ ] User added to docker group: `sudo usermod -aG docker $USER`
- [ ] Docker works without sudo: `docker ps`
- [ ] Docker Compose available: `docker compose version`

### 3. Repository Setup

- [ ] Git installed: `sudo apt install git`
- [ ] Repository cloned to VPS
- [ ] Changed to project directory: `cd ~/apps/InvestIQ`
- [ ] On correct branch (usually `main`)

## ⚙️ Application Configuration Checklist

### 1. Environment Variables

- [ ] `.env.example` copied to `.env`: `cp .env.example .env`
- [ ] `.env` file edited with actual values
- [ ] All required variables filled in:
  - [ ] `FRONTEND_URL=https://yourdomain.com`
  - [ ] `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`
  - [ ] `SUPABASE_URL=https://xxx.supabase.co`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY=eyJ...`
  - [ ] `SUPABASE_ANON_KEY=eyJ...`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`
  - [ ] `GEMINI_API_KEY=AIzaSy...`
  - [ ] `FINNHUB_API_KEY=cv1...`
- [ ] No trailing slashes in URLs
- [ ] No spaces around `=` signs
- [ ] No quotes around values (unless needed)

### 2. Nginx Configuration

- [ ] Edited `nginx/conf.d/investiq.conf`
- [ ] Replaced `yourdomain.com` with actual domain (3 places):
  - [ ] Line ~7: `server_name`
  - [ ] Line ~13: `server_name`
  - [ ] Line ~20-21: SSL certificate paths
- [ ] Saved changes

### 3. SSL Setup Script

- [ ] Edited `ssl-setup.sh`
- [ ] Updated `DOMAIN="yourdomain.com"` with actual domain
- [ ] Updated `EMAIL="your-email@example.com"` with actual email
- [ ] Saved changes

### 4. Script Permissions

- [ ] Made scripts executable:
  ```bash
  chmod +x deploy.sh ssl-setup.sh validate.sh
  ```

## 🚀 Deployment Checklist

### 1. Pre-Deployment Validation

- [ ] Ran validation script: `./validate.sh`
- [ ] All required files present
- [ ] Environment variables validated
- [ ] No critical errors reported

### 2. Initial Deployment (HTTP)

- [ ] Ran deployment script: `./deploy.sh`
- [ ] Build completed successfully (may take 5-10 minutes)
- [ ] All containers started:
  - [ ] `investiq-backend` - Up
  - [ ] `investiq-frontend` - Up
  - [ ] `investiq-nginx` - Up
  - [ ] `investiq-certbot` - Up
- [ ] Checked logs: `docker compose logs -f`
- [ ] No critical errors in logs

### 3. Backend Verification

- [ ] Backend health check works: `curl http://localhost:4000/health`
- [ ] Response: `{"status":"healthy"}`
- [ ] API docs accessible: `curl http://localhost:4000/api-docs`

### 4. Frontend Verification

- [ ] Frontend responds: `curl http://localhost:3000`
- [ ] HTML returned (no errors)
- [ ] Can access via browser: `http://your-vps-ip:3000`

### 5. SSL Setup

- [ ] DNS propagation complete (domain points to VPS)
- [ ] Ran SSL setup: `./ssl-setup.sh`
- [ ] Certificate obtained successfully
- [ ] Nginx reloaded without errors
- [ ] HTTPS accessible: `https://yourdomain.com`
- [ ] HTTP redirects to HTTPS automatically

## ✅ Post-Deployment Verification

### 1. Application Functionality

- [ ] Can access: `https://yourdomain.com`
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] Can navigate to signup page
- [ ] Can create account (test with disposable email)
- [ ] Can sign in with created account
- [ ] Dashboard loads with data
- [ ] Stock search works
- [ ] Can view stock details
- [ ] AI features work:
  - [ ] Research assistant responds
  - [ ] Screener works
  - [ ] Can add to watchlist

### 2. API Endpoints

- [ ] Backend health: `curl https://yourdomain.com/health`
- [ ] API docs: `https://yourdomain.com/api-docs`
- [ ] Can access API: `curl https://yourdomain.com/api/stocks/market`

### 3. Security Checks

- [ ] HTTPS certificate valid (green lock in browser)
- [ ] HTTP redirects to HTTPS
- [ ] Certificate from Let's Encrypt
- [ ] Security headers present:
  ```bash
  curl -I https://yourdomain.com | grep -E "Strict-Transport|X-Frame|X-Content"
  ```
- [ ] No mixed content warnings in browser console

### 4. Performance Checks

- [ ] Page loads in under 3 seconds
- [ ] API responses fast (< 1 second)
- [ ] No memory issues: `docker stats`
- [ ] CPU usage reasonable (< 50% idle)
- [ ] Disk space sufficient: `df -h`

### 5. Container Health

- [ ] All containers healthy: `docker compose ps`
- [ ] No restart loops in logs
- [ ] Health checks passing
- [ ] No out-of-memory errors

## 📊 Monitoring Setup (Optional)

- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error notifications
- [ ] Set up log monitoring
- [ ] Document admin credentials securely

## 🔒 Security Hardening (Optional)

- [ ] Changed default SSH port (optional)
- [ ] Disabled SSH password authentication
- [ ] Set up fail2ban (optional)
- [ ] Configured automatic security updates
- [ ] Backed up SSL certificates
- [ ] Documented recovery procedures

## 📚 Documentation Completed

- [ ] Deployment date documented
- [ ] Admin credentials saved securely
- [ ] Environment variables backed up (securely!)
- [ ] Domain configuration documented
- [ ] API keys stored in password manager
- [ ] Recovery procedures documented

## 🎯 Optional Enhancements

- [ ] Custom domain for Supabase (optional)
- [ ] CDN setup (Cloudflare, etc.)
- [ ] Database backup automation
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment setup
- [ ] Load testing performed
- [ ] SEO optimization
- [ ] Analytics integration

## ⚠️ Common Issues Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Containers won't start | `docker compose logs` then `docker compose down && docker compose up -d --force-recreate` |
| SSL failed | Verify DNS with `nslookup yourdomain.com` then retry `./ssl-setup.sh` |
| CORS errors | Check `FRONTEND_URL` in `.env` matches domain exactly, then `docker compose restart backend` |
| Frontend API errors | Check `NEXT_PUBLIC_API_URL` in `.env`, rebuild frontend |
| Out of disk space | `docker system prune -a --volumes` |
| Port conflicts | `sudo netstat -tulpn \| grep -E ':(80\|443)'` |

## 📞 Support Resources

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Full Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Docker Details**: [docker/README.md](docker/README.md)
- **Local Dev**: [SETUP.md](SETUP.md)
- **Summary**: [DOCKER_MIGRATION_SUMMARY.md](DOCKER_MIGRATION_SUMMARY.md)

---

## Final Checklist Summary

Before going live, ensure:

✅ All containers running and healthy  
✅ HTTPS working with valid certificate  
✅ Can create account and sign in  
✅ All main features working  
✅ No errors in logs  
✅ Environment variables secured  
✅ Monitoring configured  
✅ Documentation completed  

**Estimated Total Time**: 25-35 minutes

**Need help?** Check the troubleshooting section in [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Deployment Date**: _____________

**Domain**: _____________

**VPS IP**: _____________

**Notes**: _____________
