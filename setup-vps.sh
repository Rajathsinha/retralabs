#!/bin/bash

# RetraLabs VPS Setup Script
# This script sets up the CI/CD environment on your VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="retralabs"
APP_DIR="/opt/retralabs"
DOMAIN="${1:-localhost}"  # Optional domain parameter
WEBHOOK_SECRET="${2:-$(openssl rand -hex 32)}"  # Generate random secret if not provided

echo -e "${BLUE}🚀 Setting up RetraLabs CI/CD on VPS${NC}"
echo -e "${YELLOW}Domain: ${DOMAIN}${NC}"
echo -e "${YELLOW}App Directory: ${APP_DIR}${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run this script with sudo privileges${NC}"
    exit 1
fi

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install required packages
echo -e "${BLUE}📦 Installing required packages...${NC}"
apt install -y curl wget git docker.io docker-compose nginx certbot python3-certbot-nginx

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Create application directory
echo -e "${BLUE}📁 Creating application directory...${NC}"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone repository (replace with your actual repo URL)
echo -e "${BLUE}📥 Cloning repository...${NC}"
# git clone https://github.com/yourusername/retralabs.git .
# For now, we'll assume the code is already there or will be deployed via webhook

# Copy systemd services
echo -e "${BLUE}⚙️ Installing systemd services...${NC}"
cp retralabs.service /etc/systemd/system/
cp retralabs-webhook.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable retralabs
systemctl enable retralabs-webhook

# Create environment file
echo -e "${BLUE}🔧 Creating environment configuration...${NC}"
cat > .env << EOF
NODE_ENV=production
PORT=3000
WEBHOOK_SECRET=${WEBHOOK_SECRET}
DOMAIN=${DOMAIN}
EOF

# Set proper permissions
chown -R www-data:www-data "$APP_DIR"
chmod +x deploy.sh

# Configure Nginx
echo -e "${BLUE}🌐 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/retralabs << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy to the application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Deploy webhook (host service on port 9000)
    location = /webhook/deploy {
        proxy_pass http://127.0.0.1:9000/webhook/deploy;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/retralabs /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Start services
echo -e "${BLUE}▶️ Starting services...${NC}"
systemctl start nginx
systemctl start retralabs
systemctl start retralabs-webhook

# Setup SSL if domain is provided and not localhost
if [ "$DOMAIN" != "localhost" ]; then
    echo -e "${BLUE}🔒 Setting up SSL certificate...${NC}"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || true
fi

# Firewall configuration
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Add your webhook secret to GitHub/GitLab webhooks:"
echo "   WEBHOOK_SECRET=${WEBHOOK_SECRET}"
echo ""
echo "2. Configure your Git repository webhook to point to:"
echo "   https://${DOMAIN}/webhook/deploy"
echo ""
echo "3. Test the deployment by pushing to your main branch"
echo ""
echo -e "${YELLOW}📊 Useful commands:${NC}"
echo "• Check status: systemctl status retralabs"
echo "• View logs: docker compose logs -f"
echo "• Manual deploy: cd $APP_DIR && ./deploy.sh"
echo "• Restart: systemctl restart retralabs"
echo ""
echo -e "${GREEN}🎉 Your CI/CD pipeline is ready!${NC}"
