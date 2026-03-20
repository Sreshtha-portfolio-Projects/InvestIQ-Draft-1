#!/bin/bash

# InvestIQ - Complete Deployment Validation Script
# This script checks all components and configurations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  InvestIQ Deployment Validation Script  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ((ERRORS++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Check Docker
echo -e "${YELLOW}Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    print_status 0 "Docker is installed"
    docker --version
else
    print_status 1 "Docker is not installed"
fi

if command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null; then
    print_status 0 "Docker Compose is installed"
    docker compose version 2>/dev/null || docker-compose --version
else
    print_status 1 "Docker Compose is not installed"
fi

echo ""

# Check .env file
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ -f .env ]; then
    print_status 0 ".env file exists"
    
    # Check required variables
    required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_ANON_KEY" 
                   "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
                   "GEMINI_API_KEY" "FINNHUB_API_KEY" "FRONTEND_URL" "NEXT_PUBLIC_API_URL")
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env && [ "$(grep "^${var}=" .env | cut -d= -f2)" != "" ]; then
            print_status 0 "$var is set"
        else
            print_status 1 "$var is missing or empty"
        fi
    done
else
    print_status 1 ".env file not found"
fi

echo ""

# Check Docker files
echo -e "${YELLOW}Checking Docker configuration files...${NC}"
[ -f docker-compose.yml ] && print_status 0 "docker-compose.yml exists" || print_status 1 "docker-compose.yml missing"
[ -f backend/Dockerfile ] && print_status 0 "backend/Dockerfile exists" || print_status 1 "backend/Dockerfile missing"
[ -f frontend/Dockerfile ] && print_status 0 "frontend/Dockerfile exists" || print_status 1 "frontend/Dockerfile missing"
[ -f nginx/nginx.conf ] && print_status 0 "nginx/nginx.conf exists" || print_status 1 "nginx/nginx.conf missing"
[ -f nginx/conf.d/investiq.conf ] && print_status 0 "nginx/conf.d/investiq.conf exists" || print_status 1 "nginx/conf.d/investiq.conf missing"

echo ""

# Check if Nginx config has been updated
echo -e "${YELLOW}Checking Nginx domain configuration...${NC}"
if grep -q "yourdomain.com" nginx/conf.d/investiq.conf; then
    print_warning "Nginx config still has 'yourdomain.com' - update with your actual domain"
else
    print_status 0 "Nginx config appears to be customized"
fi

echo ""

# Check containers
echo -e "${YELLOW}Checking Docker containers...${NC}"
if docker compose ps &> /dev/null || docker-compose ps &> /dev/null; then
    if docker compose ps | grep -q "investiq-backend" || docker-compose ps | grep -q "investiq-backend"; then
        print_status 0 "Backend container exists"
        
        # Check if running
        if docker compose ps | grep "investiq-backend" | grep -q "Up" || docker-compose ps | grep "investiq-backend" | grep -q "Up"; then
            print_status 0 "Backend container is running"
        else
            print_status 1 "Backend container is not running"
        fi
    else
        print_warning "Backend container not found (may not be deployed yet)"
    fi
    
    if docker compose ps | grep -q "investiq-frontend" || docker-compose ps | grep -q "investiq-frontend"; then
        print_status 0 "Frontend container exists"
        
        if docker compose ps | grep "investiq-frontend" | grep -q "Up" || docker-compose ps | grep "investiq-frontend" | grep -q "Up"; then
            print_status 0 "Frontend container is running"
        else
            print_status 1 "Frontend container is not running"
        fi
    else
        print_warning "Frontend container not found (may not be deployed yet)"
    fi
    
    if docker compose ps | grep -q "investiq-nginx" || docker-compose ps | grep -q "investiq-nginx"; then
        print_status 0 "Nginx container exists"
        
        if docker compose ps | grep "investiq-nginx" | grep -q "Up" || docker-compose ps | grep "investiq-nginx" | grep -q "Up"; then
            print_status 0 "Nginx container is running"
        else
            print_status 1 "Nginx container is not running"
        fi
    else
        print_warning "Nginx container not found (may not be deployed yet)"
    fi
else
    print_warning "No containers found (application may not be deployed yet)"
fi

echo ""

# Check ports
echo -e "${YELLOW}Checking port availability...${NC}"
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":80 "; then
        print_status 0 "Port 80 is in use (HTTP)"
    else
        print_warning "Port 80 is not in use"
    fi
    
    if netstat -tuln | grep -q ":443 "; then
        print_status 0 "Port 443 is in use (HTTPS)"
    else
        print_warning "Port 443 is not in use (SSL may not be configured)"
    fi
else
    print_warning "netstat not available, cannot check ports"
fi

echo ""

# Test endpoints
echo -e "${YELLOW}Testing application endpoints...${NC}"

# Test localhost backend
if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    print_status 0 "Backend health check (localhost:4000) responds"
else
    print_warning "Backend health check not responding (may not be deployed)"
fi

# Test localhost frontend
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    print_status 0 "Frontend (localhost:3000) responds"
else
    print_warning "Frontend not responding (may not be deployed)"
fi

echo ""

# Check SSL certificates
echo -e "${YELLOW}Checking SSL certificates...${NC}"
if [ -d "certbot/conf/live" ] && [ "$(ls -A certbot/conf/live)" ]; then
    print_status 0 "SSL certificates directory exists and contains data"
    
    # List domains
    for domain_dir in certbot/conf/live/*/; do
        if [ -d "$domain_dir" ]; then
            domain=$(basename "$domain_dir")
            echo -e "  ${GREEN}→${NC} Certificate found for: $domain"
            
            # Check expiry if openssl is available
            if command -v openssl &> /dev/null && [ -f "${domain_dir}cert.pem" ]; then
                expiry=$(openssl x509 -enddate -noout -in "${domain_dir}cert.pem" | cut -d= -f2)
                echo -e "    ${BLUE}Expires:${NC} $expiry"
            fi
        fi
    done
else
    print_warning "No SSL certificates found (run ssl-setup.sh to obtain certificates)"
fi

echo ""

# Check disk space
echo -e "${YELLOW}Checking disk space...${NC}"
df_output=$(df -h / | tail -1)
used_percent=$(echo $df_output | awk '{print $5}' | sed 's/%//')

if [ $used_percent -lt 80 ]; then
    print_status 0 "Disk space OK ($used_percent% used)"
else
    print_warning "Disk space getting low ($used_percent% used)"
fi

echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo -e "${YELLOW}These are typically expected before initial deployment${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo -e "${YELLOW}Please fix the errors above before deploying${NC}"
    exit 1
fi
