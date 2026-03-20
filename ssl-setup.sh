#!/bin/bash

# InvestIQ SSL Certificate Setup Script
# This script obtains SSL certificates using Let's Encrypt

set -e

# Configuration
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== InvestIQ SSL Certificate Setup ===${NC}"
echo ""

# Check if domain and email are set
if [ "$DOMAIN" = "yourdomain.com" ] || [ "$EMAIL" = "your-email@example.com" ]; then
    echo -e "${RED}ERROR: Please edit this script and set your actual domain and email${NC}"
    echo "Edit ssl-setup.sh and replace:"
    echo "  DOMAIN with your actual domain name"
    echo "  EMAIL with your actual email address"
    exit 1
fi

echo -e "${YELLOW}Domain:${NC} $DOMAIN"
echo -e "${YELLOW}Email:${NC} $EMAIL"
echo ""

# Create directories
echo -e "${GREEN}Creating directories...${NC}"
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Check if nginx is running
if ! docker-compose ps | grep -q "investiq-nginx"; then
    echo -e "${YELLOW}Starting nginx...${NC}"
    docker-compose up -d nginx
    sleep 5
fi

# Obtain certificate
echo -e "${GREEN}Obtaining SSL certificate...${NC}"
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Reload nginx
echo -e "${GREEN}Reloading nginx...${NC}"
docker-compose exec nginx nginx -s reload

echo ""
echo -e "${GREEN}=== SSL Certificate Setup Complete! ===${NC}"
echo -e "Your site should now be accessible at: ${GREEN}https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} Certificates will auto-renew via the certbot container"
