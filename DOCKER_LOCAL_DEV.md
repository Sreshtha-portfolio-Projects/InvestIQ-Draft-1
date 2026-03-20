# InvestIQ - Local Docker Development

Quick guide for running InvestIQ with Docker locally (alternative to manual `npm run dev`).

## Why Use Docker Locally?

- Consistent environment across team members
- No need to install Node.js locally
- Easier dependency management
- Closer to production setup

## Prerequisites

- Docker Desktop installed (Windows, Mac, Linux)
- `.env` file configured (see below)

## Quick Start

### 1. Create Environment File

```bash
# Copy from example
cp .env.example .env.local

# Edit with your local values
```

Your `.env.local` should look like:

```env
# Use localhost for local development
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Supabase (same as production)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API Keys (same as production)
GEMINI_API_KEY=AIzaSy...
FINNHUB_API_KEY=cv1...
```

### 2. Start Development Containers

```bash
# Start with hot reload enabled
docker compose -f docker-compose.dev.yml --env-file .env.local up
```

Or in detached mode:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.local up -d
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **API Docs**: http://localhost:4000/api-docs

## Development Workflow

### View Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Backend only
docker compose -f docker-compose.dev.yml logs -f backend

# Frontend only
docker compose -f docker-compose.dev.yml logs -f frontend
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.dev.yml restart

# Restart backend only
docker compose -f docker-compose.dev.yml restart backend
```

### Stop Services

```bash
docker compose -f docker-compose.dev.yml down
```

### Rebuild After Package Changes

```bash
# Rebuild and start
docker compose -f docker-compose.dev.yml up --build
```

## Features

### Hot Reload

Both backend and frontend have hot reload enabled:

- **Backend**: Uses `nodemon` - auto-restarts on file changes
- **Frontend**: Uses Next.js dev mode - hot module replacement

### Volume Mapping

Your local code is mounted into containers:

```
./backend/src → /app/src (backend)
./frontend → /app (frontend)
```

Changes you make locally are immediately reflected in containers.

### Persistent Dependencies

Node modules are stored in Docker volumes, so you don't need to install them locally.

## Common Tasks

### Install New Package

**Backend:**
```bash
# Add package
docker compose -f docker-compose.dev.yml exec backend npm install <package-name>

# Save to package.json
docker compose -f docker-compose.dev.yml exec backend npm install --save <package-name>

# Rebuild
docker compose -f docker-compose.dev.yml up --build backend
```

**Frontend:**
```bash
docker compose -f docker-compose.dev.yml exec frontend npm install <package-name>
docker compose -f docker-compose.dev.yml up --build frontend
```

### Run Database Migrations

```bash
# Access backend container
docker compose -f docker-compose.dev.yml exec backend sh

# Inside container, run your migration commands
```

### Access Container Shell

```bash
# Backend
docker compose -f docker-compose.dev.yml exec backend sh

# Frontend
docker compose -f docker-compose.dev.yml exec frontend sh
```

### Clear Everything and Start Fresh

```bash
# Stop and remove containers, volumes
docker compose -f docker-compose.dev.yml down -v

# Rebuild and start
docker compose -f docker-compose.dev.yml up --build
```

## Differences from Production Setup

| Aspect | Development | Production |
|--------|-------------|------------|
| **Dockerfile** | `Dockerfile.dev` | `Dockerfile` |
| **Hot Reload** | ✅ Enabled | ❌ Disabled |
| **Volume Mount** | ✅ Local code | ❌ Copied in image |
| **Nginx** | ❌ Not used | ✅ Reverse proxy |
| **SSL** | ❌ Not needed | ✅ Let's Encrypt |
| **Build** | Development mode | Optimized production build |

## Troubleshooting

### Containers won't start

```bash
# Check logs
docker compose -f docker-compose.dev.yml logs

# Remove and recreate
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

### Port already in use

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Linux/Mac
lsof -i :3000
lsof -i :4000

# Stop the process or change ports in docker-compose.dev.yml
```

### Changes not reflecting

```bash
# Restart the service
docker compose -f docker-compose.dev.yml restart

# Or rebuild if it's a config change
docker compose -f docker-compose.dev.yml up --build
```

### Out of disk space

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Remove specific containers
docker compose -f docker-compose.dev.yml down -v
```

## VS Code Integration

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Docker Dev: Start",
      "type": "shell",
      "command": "docker compose -f docker-compose.dev.yml --env-file .env.local up",
      "problemMatcher": []
    },
    {
      "label": "Docker Dev: Stop",
      "type": "shell",
      "command": "docker compose -f docker-compose.dev.yml down",
      "problemMatcher": []
    }
  ]
}
```

## When to Use Docker vs Local npm

**Use Docker when:**
- Working with team (consistent environment)
- Testing Docker-specific issues
- Want containerized development
- Don't want Node.js installed locally

**Use local npm when:**
- Solo development
- Prefer faster startup
- Need IDE integrations
- Debugging with native tools

Both methods work perfectly fine!

## Environment Files

- `.env.local` - Local development (Docker)
- `backend/.env` - Backend local (non-Docker)
- `frontend/.env.local` - Frontend local (non-Docker)
- `.env` - Production (Docker on VPS)

---

**Tip**: You can run some services locally and others in Docker. For example, run backend in Docker but frontend locally for faster frontend development.

```bash
# Start only backend
docker compose -f docker-compose.dev.yml up backend

# Run frontend locally (in another terminal)
cd frontend
npm run dev
```
