# Docker Deployment Guide for InvestIQ

This document provides detailed information about the Docker setup for InvestIQ.

## Architecture

The application uses a multi-container Docker setup with:

1. **Backend API** (Node.js/Express)
2. **Frontend** (Next.js)
3. **Nginx** (Reverse proxy with SSL)
4. **Certbot** (SSL certificate management)

## Files Overview

### Core Docker Files

- `docker-compose.yml` - Orchestrates all containers
- `backend/Dockerfile` - Backend API container definition
- `frontend/Dockerfile` - Frontend Next.js container definition
- `.env.example` - Template for environment variables
- `.env` - Your actual environment variables (not in git)

### Nginx Configuration

- `nginx/nginx.conf` - Main Nginx configuration
- `nginx/conf.d/investiq.conf` - Site-specific configuration
- `certbot/conf/` - SSL certificates (auto-generated)
- `certbot/www/` - Certbot challenge files

### Deployment Scripts

- `deploy.sh` - Main deployment script
- `ssl-setup.sh` - SSL certificate setup script

## Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Domain name pointed to your server
- All API keys ready (Supabase, Gemini, Finnhub)

### Step 1: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your actual values
nano .env
```

### Step 2: Update Nginx Configuration

```bash
# Edit Nginx config
nano nginx/conf.d/investiq.conf

# Replace 'yourdomain.com' with your actual domain (3 places)
```

### Step 3: Deploy

```bash
# Make scripts executable
chmod +x deploy.sh ssl-setup.sh

# Run deployment
./deploy.sh
```

### Step 4: Set Up SSL

```bash
# Edit ssl-setup.sh with your domain and email
nano ssl-setup.sh

# Run SSL setup
./ssl-setup.sh
```

## Docker Compose Services

### Backend Service

- **Container name**: `investiq-backend`
- **Internal port**: 4000
- **Health check**: `/health` endpoint
- **Dependencies**: None
- **Restart policy**: unless-stopped

### Frontend Service

- **Container name**: `investiq-frontend`
- **Internal port**: 3000
- **Health check**: Root endpoint
- **Dependencies**: backend
- **Restart policy**: unless-stopped

### Nginx Service

- **Container name**: `investiq-nginx`
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Dependencies**: backend, frontend
- **Configuration**: Reverse proxy with SSL
- **Restart policy**: unless-stopped

### Certbot Service

- **Container name**: `investiq-certbot`
- **Purpose**: Auto-renew SSL certificates
- **Schedule**: Checks every 12 hours

## Environment Variables

### Required Variables

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

## Docker Commands

### Basic Operations

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart services
docker compose restart

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Building & Updating

```bash
# Rebuild all containers
docker compose build --no-cache

# Rebuild specific service
docker compose build --no-cache backend

# Pull latest images
docker compose pull

# Update and restart
docker compose up -d --build
```

### Monitoring

```bash
# Check container status
docker compose ps

# View resource usage
docker stats

# Check container health
docker inspect investiq-backend | grep -A 10 Health
```

### Debugging

```bash
# Enter backend container shell
docker exec -it investiq-backend sh

# Enter frontend container shell
docker exec -it investiq-frontend sh

# View real-time logs
docker compose logs -f --tail=100

# Check specific container logs
docker logs investiq-backend
docker logs investiq-frontend
docker logs investiq-nginx
```

## Network Architecture

All containers are on the `investiq-network` bridge network:

```
Internet → Nginx (80, 443)
           ↓
           ├─→ Backend (4000) → /api/*
           └─→ Frontend (3000) → /*
```

### Internal DNS

Containers communicate using service names:
- Backend: `http://backend:4000`
- Frontend: `http://frontend:3000`

## Volume Management

Docker Compose automatically creates volumes for:

- SSL certificates: `./certbot/conf`
- Certbot challenges: `./certbot/www`
- Nginx configs: `./nginx/`

### Backup Volumes

```bash
# Backup SSL certificates
tar -czf certbot-backup.tar.gz certbot/

# Restore SSL certificates
tar -xzf certbot-backup.tar.gz
```

## Nginx Configuration Details

### SSL Configuration

- **Protocols**: TLSv1.2, TLSv1.3
- **Ciphers**: HIGH:!aNULL:!MD5
- **HSTS**: Enabled (31536000 seconds)
- **HTTP → HTTPS**: Automatic redirect

### Proxy Headers

All requests include:
- `X-Real-IP`: Client's real IP
- `X-Forwarded-For`: Forwarding chain
- `X-Forwarded-Proto`: Protocol (https)
- `Host`: Original host header

### Caching

- Static files (`/_next/static/`): 60 minutes
- Images (`/_next/image`): 60 minutes
- API calls: No cache

## SSL Certificate Management

### Initial Setup

```bash
./ssl-setup.sh
```

### Manual Certificate Renewal

```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

### Certificate Auto-Renewal

The certbot container automatically checks for renewal every 12 hours.

### Check Certificate Expiry

```bash
# View certificate details
openssl x509 -in certbot/conf/live/yourdomain.com/cert.pem -text -noout

# Check expiry date
openssl x509 -in certbot/conf/live/yourdomain.com/cert.pem -enddate -noout
```

## Performance Optimization

### Backend Optimization

The backend Dockerfile uses multi-stage builds:
1. **deps**: Production dependencies only
2. **builder**: Build TypeScript to JavaScript
3. **runner**: Minimal production image

### Frontend Optimization

The frontend uses Next.js standalone output:
- Minimal dependencies
- Optimized bundle size
- Fast cold starts

### Nginx Optimization

- Gzip compression enabled
- Static file caching
- Connection keepalive
- Sendfile enabled

## Security Considerations

### Container Security

- Runs as non-root user (UID 1001)
- Minimal base image (alpine)
- No unnecessary packages
- Read-only filesystem where possible

### Network Security

- Containers isolated on private network
- Only Nginx exposed to internet
- Backend/frontend not directly accessible

### SSL Security

- Strong TLS protocols only
- Security headers enabled:
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `X-XSS-Protection`

## Troubleshooting

### Port Conflicts

```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
sudo lsof -i :4000

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is installed
sudo systemctl stop nginx    # if system Nginx is installed
```

### Container Won't Start

```bash
# Check logs for errors
docker compose logs backend

# Remove and recreate
docker compose down
docker compose up -d --force-recreate

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### SSL Issues

```bash
# Check certificate files exist
ls -la certbot/conf/live/yourdomain.com/

# Test SSL manually
curl -vI https://yourdomain.com

# Check Nginx config syntax
docker compose exec nginx nginx -t

# View Nginx error logs
docker compose logs nginx
```

### Memory Issues

```bash
# Check container memory usage
docker stats --no-stream

# Increase Docker memory limit (if needed)
# Edit /etc/docker/daemon.json:
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}

# Restart Docker
sudo systemctl restart docker
```

### Build Failures

```bash
# Clear build cache
docker builder prune -a

# Remove all images and rebuild
docker compose down --rmi all
docker compose build --no-cache
docker compose up -d
```

## Cleanup

### Remove All Containers

```bash
# Stop and remove all containers
docker compose down

# Remove with volumes
docker compose down -v
```

### Remove Images

```bash
# Remove InvestIQ images
docker rmi investiq-backend investiq-frontend

# Remove all unused images
docker image prune -a
```

### Complete Cleanup

```bash
# Remove everything (use with caution!)
docker compose down -v --rmi all
docker system prune -a --volumes
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Oracle VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/apps/InvestIQ
            git pull origin main
            docker compose down
            docker compose build --no-cache
            docker compose up -d
```

## Monitoring Setup

### Using Docker Stats

```bash
# Real-time stats
docker stats

# Export metrics
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Log Management

```bash
# Set log rotation in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Best Practices

1. **Always use `.env` file** - Never hardcode secrets
2. **Keep images updated** - Run `docker compose pull` regularly
3. **Monitor logs** - Check for errors daily
4. **Backup certificates** - Before renewal or migration
5. **Test before deploying** - Use staging environment
6. **Use health checks** - Ensure automatic recovery
7. **Limit container resources** - Prevent resource exhaustion
8. **Keep Docker updated** - Security patches

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)

---

For deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md)
