# RetraLabs CI/CD Setup Guide

This guide explains how to set up automatic deployment for RetraLabs on your VPS with Docker.

## 🚀 Quick Start

### 1. Initial VPS Setup

Run the automated setup script on your VPS:

```bash
# Clone your repository
git clone https://github.com/yourusername/retralabs.git
cd retralabs

# Run the setup script (requires sudo)
sudo ./setup-vps.sh yourdomain.com
```

The script will:
- Install Docker and Docker Compose
- Configure Nginx with SSL
- Set up systemd service
- Generate webhook secret
- Start the application

### 2. Configure Git Webhooks

#### GitHub Setup:
1. Go to your repository → Settings → Webhooks
2. Click "Add webhook"
3. Set Payload URL: `https://yourdomain.com/webhook/deploy`
4. Content type: `application/json`
5. Secret: Use the `WEBHOOK_SECRET` from setup output
6. Events: Select "Just the push event"
7. Branch: `main` or `master`

#### GitLab Setup:
1. Go to your project → Settings → Webhooks
2. Set URL: `https://yourdomain.com/webhook/deploy`
3. Secret Token: Use the `WEBHOOK_SECRET` from setup output
4. Trigger: Select "Push events"
5. Branch: `main` or `master`

## 📋 Manual Deployment

If you need to deploy manually:

```bash
# SSH into your VPS
ssh user@your-vps

# Go to app directory
cd /opt/retralabs

# Run deployment
./deploy.sh
```

## 🔧 Configuration Files

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
nano .env
```

Required variables:
- `WEBHOOK_SECRET`: Random string for webhook security
- `DOMAIN`: Your domain name
- `NODE_ENV`: Set to `production`
- `PORT`: Application port (default: 3000)

### Docker Compose

The `docker-compose.yml` includes:
- Health checks
- Environment variable loading
- Volume mounts for logs
- Automatic restarts

### Systemd Service

The `retralabs.service` manages:
- Automatic startup on boot
- Proper container lifecycle
- Service restart on failure

## 🛠️ Available Commands

### Deployment Script

```bash
./deploy.sh              # Full deployment
./deploy.sh status       # Check container status
./deploy.sh rollback     # Rollback to previous version
```

### Docker Commands

```bash
docker-compose logs -f   # View logs
docker-compose ps        # Check container status
docker-compose restart   # Restart containers
```

### Systemd Commands

```bash
sudo systemctl status retralabs    # Check service status
sudo systemctl restart retralabs   # Restart service
sudo systemctl stop retralabs      # Stop service
sudo systemctl start retralabs     # Start service
```

## 🔍 Monitoring & Troubleshooting

### Logs

```bash
# Application logs
docker-compose logs -f retralabs

# Deployment logs
tail -f deploy.log

# System logs
sudo journalctl -u retralabs -f
```

### Health Checks

The application includes health check endpoints:
- `GET /health` - Application health
- Container health checks via Docker

### Common Issues

1. **Webhook not triggering**:
   - Check webhook secret matches `.env`
   - Verify domain and SSL certificate
   - Check firewall allows port 80/443

2. **Deployment fails**:
   - Check Docker is running: `sudo systemctl status docker`
   - Check git repository access
   - Review `deploy.log` for errors

3. **Application not responding**:
   - Check container status: `docker-compose ps`
   - Check Nginx config: `sudo nginx -t`
   - Check application logs

## 🔒 Security Considerations

1. **Webhook Secret**: Always use a strong, random secret
2. **Firewall**: Only open necessary ports (22, 80, 443)
3. **SSL**: Always use HTTPS for webhooks
4. **User Permissions**: Run services as non-root user
5. **Updates**: Keep system and Docker images updated

## 📊 Deployment Flow

```
Git Push → Webhook → Server Pull → Build → Health Check → Deploy
     ↓          ↓         ↓        ↓         ↓          ↓
  main branch  /webhook  git pull  docker    /health    nginx
              /deploy    deploy   build     endpoint   proxy
```

## 🚀 Advanced Configuration

### Custom Domain

Update `/etc/nginx/sites-available/retralabs` for custom configurations.

### Database Integration

Add database service to `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: retralabs
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data

  retralabs:
    depends_on:
      - db
```

### Monitoring

Add monitoring with Prometheus/Grafana or integrate with your existing monitoring stack.

## 📞 Support

For issues:
1. Check logs using the commands above
2. Verify configuration files
3. Test webhook manually: `curl -X POST -H "X-GitHub-Event: push" your-webhook-url`

The deployment script includes automatic rollback on failure, so your application should remain available even if deployments fail.
