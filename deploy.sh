#!/bin/bash

# InvestIQ Deployment Script for Oracle VPS
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  InvestIQ - Docker Deployment Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file from .env.example:${NC}"
    echo "  cp .env.example .env"
    echo "  nano .env  # Edit with your actual values"
    exit 1
fi

# Load environment variables
echo -e "${GREEN}✓ Loading environment variables...${NC}"
source .env

# Check if required variables are set
required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "GEMINI_API_KEY" "FINNHUB_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}ERROR: Missing required environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo -e "${YELLOW}Please set these variables in your .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required environment variables are set${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down

# Pull latest changes (if this is a git repo)
if [ -d .git ]; then
    echo -e "${YELLOW}Pulling latest changes from git...${NC}"
    git pull origin main || true
fi

# Build and start containers
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${YELLOW}Starting containers...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check container status
echo ""
echo -e "${GREEN}Container Status:${NC}"
docker-compose ps

# Check backend health
echo ""
echo -e "${YELLOW}Checking backend health...${NC}"
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo -e "${YELLOW}Check logs with: docker-compose logs backend${NC}"
fi

# Check frontend
echo ""
echo -e "${YELLOW}Checking frontend...${NC}"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend check failed${NC}"
    echo -e "${YELLOW}Check logs with: docker-compose logs frontend${NC}"
fi

# Show logs
echo ""
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:        docker-compose logs -f"
echo "  View backend:     docker-compose logs -f backend"
echo "  View frontend:    docker-compose logs -f frontend"
echo "  Stop services:    docker-compose down"
echo "  Restart services: docker-compose restart"
echo ""
echo -e "${GREEN}Access your application:${NC}"
echo "  Local backend:  http://localhost:4000"
echo "  Local frontend: http://localhost:3000"
echo "  Production:     https://$(echo $FRONTEND_URL | sed 's|https://||' | sed 's|http://||')"
echo ""
