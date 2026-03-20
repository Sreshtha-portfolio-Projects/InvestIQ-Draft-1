# InvestIQ Documentation Index

Complete guide to all documentation files for InvestIQ.

## 🚀 Getting Started (Pick One)

| Document | Use When | Time Required |
|----------|----------|---------------|
| [QUICKSTART.md](QUICKSTART.md) | Want to deploy FAST to production | ~25 minutes |
| [SETUP.md](SETUP.md) | Setting up local development | ~15 minutes |
| [DOCKER_LOCAL_DEV.md](DOCKER_LOCAL_DEV.md) | Want to develop using Docker locally | ~10 minutes |

## 📚 Main Documentation

### For Local Development

- **[SETUP.md](SETUP.md)** - Complete local development setup
  - Install Node.js, npm
  - Get API keys (Supabase, Gemini, Finnhub)
  - Configure environment variables
  - Run `npm run dev`
  - Troubleshoot common issues

### For Production Deployment

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Full production deployment guide
  - Oracle Cloud VPS setup
  - Docker installation
  - Complete configuration steps
  - SSL certificate setup
  - Troubleshooting guide
  - Maintenance procedures

- **[QUICKSTART.md](QUICKSTART.md)** - Rapid deployment (25 min)
  - Condensed deployment steps
  - Quick commands reference
  - Essential checklist
  - Common troubleshooting

## 🐳 Docker Documentation

### Production Docker

- **[docker-compose.yml](docker-compose.yml)** - Production orchestration
  - Backend, Frontend, Nginx, Certbot
  - Environment variables
  - Networks and volumes
  - Health checks

- **[docker/README.md](docker/README.md)** - Detailed Docker guide
  - Architecture explanation
  - All Docker commands
  - Volume management
  - Networking details
  - Security configuration
  - Performance optimization
  - Monitoring and debugging
  - CI/CD integration

### Development Docker

- **[docker-compose.dev.yml](docker-compose.dev.yml)** - Development orchestration
  - Hot reload enabled
  - Volume mounting for live code changes
  - Simplified configuration

- **[DOCKER_LOCAL_DEV.md](DOCKER_LOCAL_DEV.md)** - Local Docker development
  - Why use Docker locally
  - Setup instructions
  - Development workflow
  - Common tasks
  - Troubleshooting

## 🏗️ Architecture & Configuration

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
  - Component diagrams
  - Request flow
  - Network architecture
  - Security layers
  - Scaling strategy
  - Monitoring points
  - Disaster recovery

- **[nginx/nginx.conf](nginx/nginx.conf)** - Nginx main config
  - Worker processes
  - Gzip compression
  - Logging configuration

- **[nginx/conf.d/investiq.conf](nginx/conf.d/investiq.conf)** - Site config
  - SSL/TLS settings
  - Reverse proxy rules
  - Security headers
  - Caching policies

## 📋 Checklists & Helpers

- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Complete checklist
  - Pre-deployment requirements
  - Step-by-step verification
  - Post-deployment tests
  - Security hardening
  - Documentation tracking

- **[DOCKER_MIGRATION_SUMMARY.md](DOCKER_MIGRATION_SUMMARY.md)** - Migration guide
  - What changed from Render/Vercel
  - Files created/removed
  - Configuration differences
  - Key decisions explained

## 🔧 Scripts & Automation

### Deployment Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| [deploy.sh](deploy.sh) | Main deployment | Deploy or update application |
| [ssl-setup.sh](ssl-setup.sh) | SSL certificates | First deployment or renewal issues |
| [validate.sh](validate.sh) | Pre-deployment check | Before deploying to verify setup |

### Docker Files

| File | Purpose |
|------|---------|
| [backend/Dockerfile](backend/Dockerfile) | Production backend image |
| [backend/Dockerfile.dev](backend/Dockerfile.dev) | Development backend image |
| [frontend/Dockerfile](frontend/Dockerfile) | Production frontend image |
| [frontend/Dockerfile.dev](frontend/Dockerfile.dev) | Development frontend image |

### Configuration Files

| File | Purpose |
|------|---------|
| [.env.example](.env.example) | Environment variables template |
| [backend/.dockerignore](backend/.dockerignore) | Backend Docker ignore rules |
| [frontend/.dockerignore](frontend/.dockerignore) | Frontend Docker ignore rules |

## 📖 Reference Documentation

- **[README.md](README.md)** - Project overview
  - Features overview
  - Tech stack
  - Project structure
  - API reference
  - Quick setup

- **[backend/SWAGGER.md](backend/SWAGGER.md)** - API documentation
  - Swagger UI usage
  - All endpoints documented
  - Request/response examples

## 🎯 Quick Navigation by Task

### I want to...

#### Set up for the first time

**Local Development:**
1. Read [SETUP.md](SETUP.md)
2. Follow step-by-step instructions
3. Run `npm run dev`

**Production (Docker + VPS):**
1. Read [QUICKSTART.md](QUICKSTART.md) for fast setup
2. Or [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide
3. Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) to track progress

#### Deploy to production

1. Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
2. Run `./validate.sh`
3. Run `./deploy.sh`
4. Run `./ssl-setup.sh`
5. Verify using checklist

#### Understand the architecture

1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Check [docker/README.md](docker/README.md) for Docker details
3. Review [nginx/conf.d/investiq.conf](nginx/conf.d/investiq.conf) for routing

#### Troubleshoot an issue

1. Check relevant documentation:
   - Local: [SETUP.md](SETUP.md) → "Common Issues"
   - Production: [DEPLOYMENT.md](DEPLOYMENT.md) → "Troubleshooting"
   - Docker: [docker/README.md](docker/README.md) → "Troubleshooting"
2. Run `docker compose logs -f` (if using Docker)
3. Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) → "Common Issues"

#### Update the application

**Local:**
```bash
git pull
npm install  # if dependencies changed
npm run dev
```

**Production:**
```bash
git pull
./deploy.sh
```

#### Work with Docker locally

1. Read [DOCKER_LOCAL_DEV.md](DOCKER_LOCAL_DEV.md)
2. Create `.env.local`
3. Run `docker compose -f docker-compose.dev.yml up`

#### Configure SSL certificates

1. Read [DEPLOYMENT.md](DEPLOYMENT.md) → "Part 4: Set Up SSL"
2. Update `ssl-setup.sh` with your domain
3. Run `./ssl-setup.sh`

#### Understand what changed from Render/Vercel

1. Read [DOCKER_MIGRATION_SUMMARY.md](DOCKER_MIGRATION_SUMMARY.md)
2. See complete list of changes
3. Understand new architecture

#### Set up monitoring

1. Read [DEPLOYMENT.md](DEPLOYMENT.md) → "Monitoring Setup"
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) → "Monitoring Points"
3. Configure external monitoring (UptimeRobot, etc.)

## 📁 File Structure

```
InvestIQ/
├── README.md                          # Project overview
├── SETUP.md                           # Local development setup
├── DEPLOYMENT.md                      # Production deployment guide
├── QUICKSTART.md                      # Fast deployment (25 min)
├── ARCHITECTURE.md                    # System architecture
├── DOCKER_LOCAL_DEV.md               # Docker for local dev
├── DEPLOYMENT_CHECKLIST.md           # Complete deployment checklist
├── DOCKER_MIGRATION_SUMMARY.md       # Migration from Render/Vercel
├── INDEX.md                          # This file
│
├── docker-compose.yml                # Production orchestration
├── docker-compose.dev.yml            # Development orchestration
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
│
├── deploy.sh                         # Main deployment script
├── ssl-setup.sh                      # SSL setup script
├── validate.sh                       # Validation script
│
├── backend/
│   ├── Dockerfile                    # Production image
│   ├── Dockerfile.dev                # Development image
│   ├── .dockerignore                 # Docker ignore rules
│   └── SWAGGER.md                    # API documentation
│
├── frontend/
│   ├── Dockerfile                    # Production image
│   ├── Dockerfile.dev                # Development image
│   └── .dockerignore                 # Docker ignore rules
│
├── nginx/
│   ├── nginx.conf                    # Main Nginx config
│   └── conf.d/
│       └── investiq.conf             # Site configuration
│
└── docker/
    └── README.md                     # Detailed Docker documentation
```

## 🔍 Search by Topic

### API Keys & Configuration

- [SETUP.md](SETUP.md) - "Get Your API Keys"
- [DEPLOYMENT.md](DEPLOYMENT.md) - "Environment Variables"
- [.env.example](.env.example) - Template with all variables

### Docker

- [docker/README.md](docker/README.md) - Complete Docker guide
- [DOCKER_LOCAL_DEV.md](DOCKER_LOCAL_DEV.md) - Local development
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture diagrams

### SSL / HTTPS

- [DEPLOYMENT.md](DEPLOYMENT.md) - "Part 4: Set Up SSL"
- [ssl-setup.sh](ssl-setup.sh) - SSL setup script
- [nginx/conf.d/investiq.conf](nginx/conf.d/investiq.conf) - SSL config

### Nginx Configuration

- [nginx/nginx.conf](nginx/nginx.conf) - Main config
- [nginx/conf.d/investiq.conf](nginx/conf.d/investiq.conf) - Site config
- [ARCHITECTURE.md](ARCHITECTURE.md) - Request routing

### Deployment

- [QUICKSTART.md](QUICKSTART.md) - Fast deployment
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Checklist
- [deploy.sh](deploy.sh) - Deployment script

### Troubleshooting

- [SETUP.md](SETUP.md) - "Common Issues"
- [DEPLOYMENT.md](DEPLOYMENT.md) - "Troubleshooting"
- [docker/README.md](docker/README.md) - "Troubleshooting"
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - "Common Issues"

### Security

- [DEPLOYMENT.md](DEPLOYMENT.md) - "Security Best Practices"
- [ARCHITECTURE.md](ARCHITECTURE.md) - "Security Layers"
- [docker/README.md](docker/README.md) - "Security Considerations"

### Monitoring & Maintenance

- [DEPLOYMENT.md](DEPLOYMENT.md) - "Part 6: Maintenance & Updates"
- [ARCHITECTURE.md](ARCHITECTURE.md) - "Monitoring Points"
- [docker/README.md](docker/README.md) - "Monitoring Setup"

## 💡 Tips

1. **Start with QUICKSTART.md** if you want to deploy immediately
2. **Use SETUP.md** for local development
3. **Reference DEPLOYMENT_CHECKLIST.md** during deployment
4. **Bookmark INDEX.md** for easy navigation
5. **Check ARCHITECTURE.md** to understand how everything works

## 📞 Getting Help

1. Check the relevant documentation first
2. Look at "Troubleshooting" sections
3. Review "Common Issues" in checklists
4. Check container logs: `docker compose logs -f`
5. Validate setup: `./validate.sh`

## 🎯 Recommended Reading Order

### For New Developers

1. [README.md](README.md) - Understand the project
2. [SETUP.md](SETUP.md) - Set up locally
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand architecture
4. Start coding!

### For Deployment Engineers

1. [DOCKER_MIGRATION_SUMMARY.md](DOCKER_MIGRATION_SUMMARY.md) - Understand changes
2. [QUICKSTART.md](QUICKSTART.md) or [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy
3. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Verify deployment
4. [docker/README.md](docker/README.md) - Deep dive into Docker

### For DevOps Engineers

1. [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
2. [docker/README.md](docker/README.md) - Docker details
3. [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment procedures
4. Nginx configs - Routing and security

---

**Last Updated**: 2026-03-19

**Total Documentation Files**: 15+

**Estimated Reading Time**: ~2-3 hours (complete read-through)

**Quick Start Time**: ~25 minutes (following QUICKSTART.md)
