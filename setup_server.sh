#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (Latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Setup Nginx Configuration
cat <<EOF | sudo tee /etc/nginx/sites-available/retralabs
server {
    listen 80;
    server_name 82.112.235.82;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable Nginx config and restart
sudo ln -s /etc/nginx/sites-available/retralabs /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo system_ctl restart nginx

echo "Setup complete! Now transfer your files, run 'npm install' and 'pm2 start ecosystem.config.js'"

